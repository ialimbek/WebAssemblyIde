/**
 * MonacoWrapper — React component wrapping the Monaco Editor.
 *
 * Connects the Monaco Editor instance to the EditorManager,
 * handling model creation, content sync, dirty state, and tab switching.
 *
 * This component is lazy-loaded by the panel system to avoid
 * blocking the critical startup path.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useState,
  type CSSProperties,
} from "react";
import type { IDisposable } from "monaco-editor";
import type { FileUri } from "./types.js";
import type { EditorManager } from "./editor-manager.js";

/** Props for the MonacoWrapper component */
export interface MonacoWrapperProps {
  /** Editor manager instance */
  editorManager: EditorManager;
  /** URI this editor instance should display. Falls back to manager active URI. */
  activeUri?: FileUri | null;
  /** Additional CSS class name */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Callback when Monaco instance is ready */
  onReady?: () => void;
}

/**
 * MonacoWrapper — renders a Monaco Editor and connects it to EditorManager.
 *
 * Usage:
 *   <MonacoWrapper editorManager={editorManager} />
 *
 * The component:
 * - Initializes Monaco Editor on mount
 * - Creates/switches Monaco models when tabs change
 * - Syncs content changes back to EditorManager
 * - Updates editor options from config
 * - Disposes Monaco resources on unmount
 */
export function MonacoWrapper({
  editorManager,
  activeUri: activeUriProp,
  className,
  style,
  onReady,
}: MonacoWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const suppressContentChangeRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  // Track disposables for cleanup
  const disposablesRef = useRef<IDisposable[]>([]);

  /**
   * Measure the editor container and return explicit {width, height}.
   * Falls back to parent dimensions if the container itself is 0x0.
   */
  const measureContainer = useCallback((): { width: number; height: number } => {
    const el = containerRef.current;
    if (!el) return { width: 0, height: 0 };
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }
    // Fallback: try offsetWidth / offsetHeight (includes borders, no fractional issues)
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      return { width: el.offsetWidth, height: el.offsetHeight };
    }
    // Final fallback: parent element
    const parent = el.parentElement;
    if (parent) {
      const pRect = parent.getBoundingClientRect();
      return { width: pRect.width, height: pRect.height };
    }
    return { width: 0, height: 0 };
  }, []);

  /**
   * Initialize Monaco Editor
   */
  const initMonaco = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      if (!container) return;

      // Dynamic import for lazy loading
      const monaco = await import("monaco-editor");
      if (!containerRef.current || containerRef.current !== container) return;
      monacoRef.current = monaco;

      // Measure container BEFORE creating the editor so Monaco gets
      // real dimensions on the very first paint.
      const dims = measureContainer();

      const activeUri = activeUriProp ?? editorManager.getActiveUri();
      const activeModelInfo = activeUri
        ? editorManager.models.getModelInfo(activeUri)
        : null;
      const activeContent = activeUri
        ? editorManager.models.getContent(activeUri)
        : undefined;
      const initialModel =
        activeUri && activeModelInfo && activeContent !== undefined
          ? (() => {
              const uri = monaco.Uri.parse(activeUri);
              const existing = monaco.editor.getModel(uri);
              if (existing) {
                if (existing.getValue() !== activeContent) {
                  existing.setValue(activeContent);
                }
                return existing;
              }
              return monaco.editor.createModel(
                activeContent,
                activeModelInfo.languageId,
                uri,
              );
            })()
          : null;

      // Create editor instance
      const editor = monaco.editor.create(container, {
        value: initialModel ? undefined : "",
        language: initialModel ? undefined : "plaintext",
        model: initialModel,
        theme: editorManager.getConfig().theme,
        fontSize: editorManager.getConfig().fontSize,
        fontFamily: editorManager.getConfig().fontFamily,
        tabSize: editorManager.getConfig().tabSize,
        insertSpaces: editorManager.getConfig().insertSpaces,
        wordWrap: editorManager.getConfig().wordWrap,
        minimap: {
          enabled: editorManager.getConfig().minimap,
          showSlider: "mouseover",
          side: "right",
        },
        lineNumbers: editorManager.getConfig().lineNumbers,
        renderWhitespace: editorManager.getConfig().renderWhitespace,
        // Let Monaco listen to resize events, but we also force layout
        // explicitly at critical moments (mount, model switch, etc.).
        automaticLayout: true,
        scrollBeyondLastLine: false,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12,
          alwaysConsumeMouseWheel: false,
        },
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        bracketPairColorization: { enabled: true },
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        padding: { top: 0, bottom: 0 },
        autoClosingBrackets: "never",
        autoClosingQuotes: "never",
        autoSurround: "never",
      });

      editorRef.current = editor;

      // Explicit layout with measured dimensions on init.
      editor.layout(dims);
      if (activeUri && initialModel) {
        editorManager.setCursorPosition(activeUri, { line: 1, column: 1 });
        editor.setPosition({ lineNumber: 1, column: 1 });
        editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
      }

      // Multi-pass re-layout to handle any post-mount flex/layout settling.
      const forceLayout = () => {
        if (!editorRef.current) return;
        const d = measureContainer();
        editorRef.current.layout(d);
      };

      requestAnimationFrame(() => {
        forceLayout();
        requestAnimationFrame(() => {
          forceLayout();
          setTimeout(() => forceLayout(), 100);
          setTimeout(() => forceLayout(), 300);
        });
      });

      // Set up ResizeObserver for more robust layout updates
      // when the container size changes (e.g. sidebar collapse, split).
      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        const ro = new ResizeObserver(() => {
          forceLayout();
        });
        ro.observe(containerRef.current);
        disposablesRef.current.push({
          dispose: () => ro.disconnect(),
        });
      }

      // Sync content changes to EditorManager
      const contentChangeDisposable = editor.onDidChangeModelContent(() => {
        if (suppressContentChangeRef.current) return;

        const activeUri = editorManager.getActiveUri();
        if (!activeUri) return;

        const model = editor.getModel();
        if (!model) return;

        const newContent = model.getValue();

        // Get current model info before update
        const prevModelInfo = editorManager.models.getModelInfo(activeUri);
        const wasDirty = prevModelInfo?.isDirty ?? false;

        // Get saved content using public method
        const savedContent = editorManager.models.getSavedContent(activeUri) ?? "";
        const isNowDirty = newContent !== savedContent;

        // Update tab dirty state based on actual content comparison
        if (wasDirty !== isNowDirty) {
          editorManager.setTabDirty(activeUri, isNowDirty);
        }

        // Also update the editor model manager with new content
        editorManager.models.updateContent(activeUri, newContent);
      });

      // Sync cursor position
      const cursorChangeDisposable = editor.onDidChangeCursorPosition((e) => {
        const activeUri = editorManager.getActiveUri();
        if (!activeUri) return;

        editorManager.setCursorPosition(activeUri, {
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });

      disposablesRef.current.push(
        contentChangeDisposable,
        cursorChangeDisposable,
      );

      setIsReady(true);
      onReady?.();
    } catch (err) {
      console.error("[MonacoWrapper] Failed to initialize Monaco:", err);
    }
  }, [editorManager, onReady, measureContainer]);

  /**
   * Create or get a Monaco model for a URI
   */
  const getOrCreateMonacoModel = useCallback(
    (uri: FileUri, content: string, languageId: string) => {
      const monaco = monacoRef.current;
      if (!monaco) return null;

      const existing = monaco.editor.getModel(monaco.Uri.parse(uri));
      if (existing) {
        // Update content if different
        if (existing.getValue() !== content) {
          suppressContentChangeRef.current = true;
          try {
            existing.setValue(content);
          } finally {
            suppressContentChangeRef.current = false;
          }
        }
        return existing;
      }

      // Create new model
      const model = monaco.editor.createModel(
        content,
        languageId,
        monaco.Uri.parse(uri),
      );
      return model;
    },
    [],
  );

  /**
   * Switch the editor to display a specific file
   */
  const switchToFile = useCallback(
    (uri: FileUri) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;

      const modelInfo = editorManager.models.getModelInfo(uri);
      const content = editorManager.models.getContent(uri);
      if (!modelInfo || content === undefined) return;

      const model = getOrCreateMonacoModel(uri, content, modelInfo.languageId);
      if (!model) return;

      editor.setModel(model);

      const resetScroll = () => {
        editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
        editor.setScrollTop(0);
        editor.setScrollLeft(0);
        const scrollable = containerRef.current?.querySelector(
          ".monaco-scrollable-element",
        ) as HTMLElement | null;
        if (scrollable) {
          scrollable.scrollTop = 0;
          scrollable.scrollLeft = 0;
        }
      };

      // Reset scroll to top-left — prevents "phantom blank lines"
      // caused by stale scroll state from a previous file.
      resetScroll();
      editor.revealLineNearTop(1);

      // Force explicit layout after model switch to prevent the
      // "30-40 blank lines" gap that Monaco sometimes renders
      // when the container dimensions are stale.
      const forceLayout = () => {
        if (!editorRef.current) return;
        const d = measureContainer();
        editorRef.current.layout(d);
      };

      forceLayout();
      requestAnimationFrame(() => {
        forceLayout();
        requestAnimationFrame(() => {
          forceLayout();
          setTimeout(() => {
            resetScroll();
            editor.revealLineNearTop(1);
            forceLayout();
          }, 100);
        });
      });

      // Restore cursor position without letting stale scroll offset survive.
      const cursorPos = editorManager.getCursorPosition(uri);
      if (cursorPos) {
        editor.setPosition({
          lineNumber: cursorPos.line,
          column: cursorPos.column,
        });
        resetScroll();
      }
    },
    [editorManager, getOrCreateMonacoModel, measureContainer],
  );

  // Initialize Monaco on mount — useLayoutEffect so the container has
  // already been laid out by the browser before we query its size.
  useLayoutEffect(() => {
    initMonaco();

    return () => {
      // Dispose all tracked disposables
      for (const d of disposablesRef.current) {
        d.dispose();
      }
      disposablesRef.current = [];

      // Dispose editor
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }

      // Monaco models are intentionally not disposed globally here.
      // In React StrictMode, async mount/unmount can otherwise dispose
      // models that a newly mounted editor instance is about to use.
    };
  }, [initMonaco]);

  // On mount / when ready / when activeUri prop changes: switch to target file.
  useEffect(() => {
    if (!isReady) return;

    const targetUri = activeUriProp ?? editorManager.getActiveUri();
    if (targetUri) {
      switchToFile(targetUri);
    }
  }, [activeUriProp, editorManager, isReady, switchToFile]);

  // Listen for active tab changes and switch models
  useEffect(() => {
    const disposable = editorManager.onActiveTabChanged((uri) => {
      if (uri) {
        switchToFile(uri);
      } else {
        // No active tab — clear editor
        const editor = editorRef.current;
        if (editor) {
          editor.setModel(null);
        }
      }
    });

    return () => disposable.dispose();
  }, [editorManager, switchToFile]);

  // Listen for config changes and apply them to Monaco editor
  useEffect(() => {
    const disposable = editorManager.onConfigChanged((config) => {
      const ed = editorRef.current;
      const monaco = monacoRef.current;
      if (!ed) return;
      ed.updateOptions({
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        tabSize: config.tabSize,
        insertSpaces: config.insertSpaces,
        wordWrap: config.wordWrap,
        minimap: {
          enabled: config.minimap,
          showSlider: "mouseover",
          side: "right",
        },
        lineNumbers: config.lineNumbers,
        renderWhitespace: config.renderWhitespace,
      });
      if (monaco && config.theme) {
        monaco.editor.setTheme(config.theme);
      }
    });
    return () => disposable.dispose();
  }, [editorManager]);

  // Listen for reveal-position requests (Go to Line / Go to Symbol)
  useEffect(() => {
    const disposable = editorManager.onRevealPosition((uri, position) => {
      const ed = editorRef.current;
      const monaco = monacoRef.current;
      if (!ed || !monaco) return;

      const activeUri = editorManager.getActiveUri();
      if (activeUri !== uri) {
        switchToFile(uri);
      }

      const monacoPos = {
        lineNumber: Math.max(1, position.line),
        column: Math.max(1, position.column),
      };
      ed.setPosition(monacoPos);
      ed.revealPositionInCenter(monacoPos);
      ed.focus();
    });
    return () => disposable.dispose();
  }, [editorManager, switchToFile]);

  // Listen for content changes from external sources (e.g., file reload)
  useEffect(() => {
    const disposable = editorManager.models.onModelEvent((event, uri) => {
      if (event === "contentChanged") {
        const monaco = monacoRef.current;
        const content = editorManager.models.getContent(uri);
        if (monaco && content !== undefined) {
          const model = monaco.editor.getModel(monaco.Uri.parse(uri));
          if (model && model.getValue() !== content) {
            suppressContentChangeRef.current = true;
            try {
              model.setValue(content);
            } finally {
              suppressContentChangeRef.current = false;
            }
          }
        }
      }

      if (event === "saved") {
        // Reset undo stack for saved state
        const monaco = monacoRef.current;
        const editor = editorRef.current;
        if (monaco && editor && uri === editorManager.getActiveUri()) {
          const model = editor.getModel();
          if (model) {
            // Push an undo stop to mark save point
            editor.pushUndoStop();
          }
        }
      }
    });

    return () => disposable.dispose();
  }, [editorManager]);

  // Compute container style
  const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      data-testid="monaco-editor"
    />
  );
}

// ─── Default Export ─────────────────────────────────────────────────────
export default MonacoWrapper;
