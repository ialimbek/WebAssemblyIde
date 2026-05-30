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
import { DEFAULT_EDITOR_CONFIG } from "./types.js";
import type { EditorManager } from "./editor-manager.js";
import { defineMonacoTheme } from "./monaco-theme-adapter.js";
import { loadMonacoLanguageContributions } from "./monaco-languages.js";
import type { ThemeManager } from "@webassembly-ide/ide-core";

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
  /** Shared IDE theme manager used to register Monaco-compatible themes. */
  themeManager?: ThemeManager;
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
  themeManager,
}: MonacoWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const suppressContentChangeRef = useRef(false);
  const zoomHudTimerRef = useRef<number | null>(null);
  const zoomHudRemoveTimerRef = useRef<number | null>(null);
  const activeUriPropRef = useRef<FileUri | null | undefined>(activeUriProp);
  activeUriPropRef.current = activeUriProp;

  const [isReady, setIsReady] = useState(false);
  const [zoomHud, setZoomHud] = useState<{ fontSize: number; leaving: boolean } | null>(null);

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

  const buildEditorOptions = useCallback((config: ReturnType<EditorManager["getConfig"]>) => ({
    fontSize: config.fontSize,
    fontFamily: config.fontFamily,
    tabSize: config.tabSize,
    insertSpaces: config.insertSpaces,
    wordWrap: config.wordWrap,
    minimap: {
      enabled: config.minimap,
      showSlider: "mouseover" as const,
      side: "right" as const,
    },
    lineNumbers: config.lineNumbers,
    renderWhitespace: config.renderWhitespace,
    mouseWheelZoom: config.mouseWheelZoom,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    bracketPairColorization: { enabled: config.bracketPairColorization },
    guides: { indentation: config.indentGuides },
    stickyScroll: { enabled: config.breadcrumbs },
  }), []);

  const layoutEditor = useCallback((editor: import("monaco-editor").editor.IStandaloneCodeEditor) => {
    const d = measureContainer();
    if (d.width > 0 && d.height > 0) editor.layout(d);
    else editor.layout();
  }, [measureContainer]);

  const applyEditorConfig = useCallback((
    editor: import("monaco-editor").editor.IStandaloneCodeEditor,
    config = editorManager.getConfig(),
  ) => {
    const monaco = monacoRef.current;
    editor.updateOptions(buildEditorOptions(config));
    editor.getModel()?.updateOptions({
      tabSize: config.tabSize,
      insertSpaces: config.insertSpaces,
    });
    monaco?.editor.remeasureFonts();
    layoutEditor(editor);
    requestAnimationFrame(() => layoutEditor(editor));
  }, [buildEditorOptions, editorManager, layoutEditor]);

  /**
   * Show a centered zoom HUD with the current font size percentage.
   * Automatically fades out after 2 seconds.
   */
  const showZoomHud = useCallback((fontSize: number) => {
    if (zoomHudTimerRef.current !== null) {
      window.clearTimeout(zoomHudTimerRef.current);
    }
    if (zoomHudRemoveTimerRef.current !== null) {
      window.clearTimeout(zoomHudRemoveTimerRef.current);
    }

    setZoomHud({ fontSize, leaving: false });
    zoomHudTimerRef.current = window.setTimeout(() => {
      setZoomHud((current) => current ? { ...current, leaving: true } : null);
      zoomHudRemoveTimerRef.current = window.setTimeout(() => {
        setZoomHud(null);
        zoomHudRemoveTimerRef.current = null;
      }, 500);
      zoomHudTimerRef.current = null;
    }, 2000);
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
      await loadMonacoLanguageContributions();
      if (!containerRef.current || containerRef.current !== container) return;
      monacoRef.current = monaco;
      if (themeManager) {
        for (const theme of themeManager.listThemes()) {
          defineMonacoTheme(monaco, theme);
        }
        const activeTheme = themeManager.getActiveTheme();
        defineMonacoTheme(monaco, activeTheme);
        monaco.editor.setTheme(activeTheme.id);
      }

      // Measure container BEFORE creating the editor so Monaco gets
      // real dimensions on the very first paint.
      const dims = measureContainer();

      const activeUri = activeUriPropRef.current ?? editorManager.getActiveUri();
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
        mouseWheelZoom: editorManager.getConfig().mouseWheelZoom,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
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
        bracketPairColorization: { enabled: editorManager.getConfig().bracketPairColorization },
        guides: { indentation: editorManager.getConfig().indentGuides },
        stickyScroll: { enabled: editorManager.getConfig().breadcrumbs },
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
        layoutEditor(editorRef.current);
      };

      requestAnimationFrame(() => {
        forceLayout();
        requestAnimationFrame(() => {
          forceLayout();
          setTimeout(() => forceLayout(), 100);
          setTimeout(() => forceLayout(), 300);
        });
      });

      // Set minWidth/minHeight on the container to prevent Monaco from
      // collapsing the minimap when the container is briefly too small.
      if (container) {
        container.style.minWidth = "100px";
        container.style.minHeight = "50px";
      }

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

      // Listen for Monaco config changes (e.g. Ctrl+Wheel zoom) and sync back
      // Only sync fontSize changes that differ from config to avoid feedback loops
      let isUpdatingFromConfig = false;
      const configChangeDisposable = editor.onDidChangeConfiguration((event) => {
        if (isUpdatingFromConfig) return;
        try {
          if (!event.hasChanged(monaco.editor.EditorOption.fontSize)) return;
          const fontInfo = editor.getOption(monaco.editor.EditorOption.fontInfo);
          const nextFontSize = Math.round(fontInfo.fontSize);
          const currentConfigSize = editorManager.getConfig().fontSize;
          if (nextFontSize !== currentConfigSize) {
            editorManager.updateConfig({ fontSize: nextFontSize });
            showZoomHud(nextFontSize);
          }
        } catch {
          // Editor may be disposed — ignore
        }
      });
      // Expose the flag so the config listener can set it
      (editor as any).__isUpdatingFromConfig = () => isUpdatingFromConfig;
      (editor as any).__setUpdatingFromConfig = (v: boolean) => { isUpdatingFromConfig = v; };

      disposablesRef.current.push(
        contentChangeDisposable,
        cursorChangeDisposable,
        configChangeDisposable,
      );

      setIsReady(true);
      onReady?.();
    } catch (err) {
      console.error("[MonacoWrapper] Failed to initialize Monaco:", err);
    }
  }, [applyEditorConfig, editorManager, layoutEditor, onReady, measureContainer, showZoomHud, themeManager]);

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
      const config = editorManager.getConfig();
      applyEditorConfig(editor, config);

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
        layoutEditor(editorRef.current);
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
    [applyEditorConfig, editorManager, getOrCreateMonacoModel, layoutEditor],
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

      if (zoomHudTimerRef.current !== null) {
        window.clearTimeout(zoomHudTimerRef.current);
        zoomHudTimerRef.current = null;
      }
      if (zoomHudRemoveTimerRef.current !== null) {
        window.clearTimeout(zoomHudRemoveTimerRef.current);
        zoomHudRemoveTimerRef.current = null;
      }

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
      // Set flag to prevent Monaco→config feedback loop during updateOptions
      const setFlag = (ed as any).__setUpdatingFromConfig;
      if (setFlag) setFlag(true);
      try {
        applyEditorConfig(ed, config);
        
        // Apply theme globally to all models
        if (monaco && config.theme) {
          monaco.editor.setTheme(config.theme);
        }
        
        // Apply language-specific options to all models
        if (monaco) {
          const models = monaco.editor.getModels();
          models.forEach((model) => {
            model.updateOptions({
              tabSize: config.tabSize,
              insertSpaces: config.insertSpaces,
            });
          });
        }
      } catch {
        // Editor may be disposed — ignore
      } finally {
        if (setFlag) setFlag(false);
      }
    });
    return () => disposable.dispose();
  }, [applyEditorConfig, editorManager]);

  useEffect(() => {
    if (!themeManager) return undefined;
    const applyTheme = (theme = themeManager.getActiveTheme()) => {
      const monaco = monacoRef.current;
      if (!monaco) return;
      defineMonacoTheme(monaco, theme);
      monaco.editor.setTheme(theme.id);
    };
    applyTheme();
    return themeManager.onThemeChange((theme) => applyTheme(theme));
  }, [themeManager]);

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

  /**
   * Reset editor zoom to default font size (%100).
   */
  const resetZoom = useCallback(() => {
    const nextConfig = {
      ...editorManager.getConfig(),
      fontSize: DEFAULT_EDITOR_CONFIG.fontSize,
    };
    editorManager.updateConfig({ fontSize: DEFAULT_EDITOR_CONFIG.fontSize });
    const editor = editorRef.current;
    const setFlag = editor ? (editor as any).__setUpdatingFromConfig : undefined;
    if (editor) {
      if (setFlag) setFlag(true);
      try {
        applyEditorConfig(editor, nextConfig);
        editor.focus();
      } finally {
        if (setFlag) setFlag(false);
      }
    }
    showZoomHud(DEFAULT_EDITOR_CONFIG.fontSize);
  }, [applyEditorConfig, editorManager, showZoomHud]);

  // Compute container style
  const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  const zoomPercent = zoomHud
    ? Math.round((zoomHud.fontSize / DEFAULT_EDITOR_CONFIG.fontSize) * 100)
    : 100;

  return (
    <div
      className={className}
      style={containerStyle}
    >
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, minWidth: 0, minHeight: 0 }}
        data-testid="monaco-editor"
      />
      {zoomHud && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30000,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: zoomHud.leaving ? 0 : 1,
              transform: zoomHud.leaving ? "translateY(4px) scale(0.98)" : "translateY(0) scale(1)",
              transition: "opacity 500ms ease, transform 500ms ease",
            }}
          >
            <div
              style={{
                minWidth: 100,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid var(--editorWidget-border, var(--sideBar-border, #454545))",
                background: "var(--editorWidget-background, rgba(30, 30, 30, 0.94))",
                color: "var(--editorWidget-foreground, var(--editor-foreground, #ffffff))",
                boxShadow: "0 12px 40px rgba(0,0,0,0.34)",
                fontSize: 15,
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "-0.5px",
              }}
            >
              %{zoomPercent}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetZoom();
              }}
              style={{
                pointerEvents: "auto",
                border: "1px solid var(--button-border, transparent)",
                borderRadius: 6,
                background: "var(--button-background, #0e639c)",
                color: "var(--button-foreground, #ffffff)",
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
              }}
            >
              Original Size
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Default Export ─────────────────────────────────────────────────────
export default MonacoWrapper;
