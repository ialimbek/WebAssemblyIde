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
   * Initialize Monaco Editor
   */
  const initMonaco = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // Dynamic import for lazy loading
      const monaco = await import("monaco-editor");
      monacoRef.current = monaco;

      // Create editor instance
      const editor = monaco.editor.create(containerRef.current, {
        value: "",
        language: "plaintext",
        theme: editorManager.getConfig().theme,
        fontSize: editorManager.getConfig().fontSize,
        fontFamily: editorManager.getConfig().fontFamily,
        tabSize: editorManager.getConfig().tabSize,
        insertSpaces: editorManager.getConfig().insertSpaces,
        wordWrap: editorManager.getConfig().wordWrap,
        minimap: { enabled: editorManager.getConfig().minimap },
        lineNumbers: editorManager.getConfig().lineNumbers,
        renderWhitespace: editorManager.getConfig().renderWhitespace,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        bracketPairColorization: { enabled: true },
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      });

      editorRef.current = editor;

      // Sync content changes to EditorManager
      const contentChangeDisposable = editor.onDidChangeModelContent(() => {
        if (suppressContentChangeRef.current) return;

        const activeUri = editorManager.getActiveUri();
        if (!activeUri) return;

        const model = editor.getModel();
        if (!model) return;

        editorManager.models.updateContent(activeUri, model.getValue());
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
  }, [editorManager, onReady]);

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

      // Restore cursor position if available
      const cursorPos = editorManager.getCursorPosition(uri);
      if (cursorPos) {
        editor.setPosition({
          lineNumber: cursorPos.line,
          column: cursorPos.column,
        });
      }
    },
    [editorManager, getOrCreateMonacoModel],
  );

  // Initialize Monaco on mount
  useEffect(() => {
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

      // Dispose all Monaco models
      if (monacoRef.current) {
        for (const model of monacoRef.current.editor.getModels()) {
          model.dispose();
        }
      }
    };
  }, [initMonaco]);

  useEffect(() => {
    if (!isReady) return;

    const activeUri = editorManager.getActiveUri();
    if (activeUri) {
      switchToFile(activeUri);
    }
  }, [editorManager, isReady, switchToFile]);

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
        minimap: { enabled: config.minimap },
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
    minHeight: 200,
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
