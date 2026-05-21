/**
 * DiffEditor — Monaco-based diff viewer for patch preview.
 * Shows side-by-side or inline diff between original and modified content.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";

interface DiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  readOnly?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
  /** Show inline (unified) diff instead of side-by-side */
  inline?: boolean;
}

interface DiffEditorHandle {
  /** Get the current modified content */
  getModifiedContent: () => string;
  /** Get the current original content */
  getOriginalContent: () => string;
}

export const DiffEditor = React.forwardRef<DiffEditorHandle, DiffEditorProps>(
  (
    {
      original,
      modified,
      language = "plaintext",
      readOnly = true,
      onAccept,
      onReject,
      className,
      inline = false,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);

    // Lazy load Monaco
    useEffect(() => {
      if (!containerRef.current) return;

      let disposed = false;

      const loadMonaco = async () => {
        try {
          const monaco = await import("monaco-editor");
          if (disposed || !containerRef.current) return;

          monacoRef.current = monaco;

          const editor = monaco.editor.createDiffEditor(containerRef.current, {
            readOnly,
            renderSideBySide: !inline,
            enableSplitViewResizing: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 13,
            fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
            theme:
              document.documentElement.getAttribute("data-theme") === "light"
                ? "vs"
                : "vs-dark",
          });

          const originalModel = monaco.editor.createModel(original, language);
          const modifiedModel = monaco.editor.createModel(modified, language);

          editor.setModel({
            original: originalModel,
            modified: modifiedModel,
          });

          editorRef.current = editor;
          setIsReady(true);
        } catch {
          // Monaco not available — show fallback
          setIsReady(false);
        }
      };

      loadMonaco();

      return () => {
        disposed = true;
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
    }, []);

    // Update models when props change
    useEffect(() => {
      if (!editorRef.current || !monacoRef.current) return;
      const model = editorRef.current.getModel();
      if (model) {
        model.original?.setValue(original);
        model.modified?.setValue(modified);
      }
    }, [original, modified]);

    // Expose handle
    React.useImperativeHandle(
      ref,
      () => ({
        getModifiedContent: () => {
          const model = editorRef.current?.getModel();
          return model?.modified?.getValue() ?? modified;
        },
        getOriginalContent: () => {
          const model = editorRef.current?.getModel();
          return model?.original?.getValue() ?? original;
        },
      }),
      [original, modified],
    );

    const handleAccept = useCallback(() => {
      onAccept?.();
    }, [onAccept]);

    const handleReject = useCallback(() => {
      onReject?.();
    }, [onReject]);

    // Fallback diff view when Monaco is not available
    if (!isReady && !containerRef.current) {
      return (
        <div className={className} style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "#f85149", fontWeight: 600 }}>
              - Original
            </span>
            <span style={{ color: "#3fb950", fontWeight: 600 }}>
              + Modified
            </span>
          </div>
          <FallbackDiff original={original} modified={modified} />
        </div>
      );
    }

    return (
      <div
        className={className}
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        {(onAccept || onReject) && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px solid var(--editor-background, #1e1e1e)",
              background: "var(--panel-background, #252526)",
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 13,
                opacity: 0.7,
                alignSelf: "center",
              }}
            >
              Patch Preview
            </span>
            {onReject && (
              <button
                onClick={handleReject}
                style={{
                  padding: "4px 12px",
                  border: "1px solid #f85149",
                  background: "transparent",
                  color: "#f85149",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Reject
              </button>
            )}
            {onAccept && (
              <button
                onClick={handleAccept}
                style={{
                  padding: "4px 12px",
                  border: "none",
                  background: "#238636",
                  color: "#fff",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Accept
              </button>
            )}
          </div>
        )}
        <div ref={containerRef} style={{ flex: 1, minHeight: 200 }} />
      </div>
    );
  },
);

DiffEditor.displayName = "DiffEditor";

/** Simple line-by-line fallback diff renderer. */
function FallbackDiff({
  original,
  modified,
}: {
  original: string;
  modified: string;
}) {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  const maxLen = Math.max(origLines.length, modLines.length);
  const lines: Array<{
    type: "same" | "removed" | "added";
    text: string;
    lineNum: number;
  }> = [];

  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i];
    const mod = modLines[i];
    if (orig === mod) {
      lines.push({ type: "same", text: orig ?? "", lineNum: i + 1 });
    } else {
      if (orig !== undefined)
        lines.push({ type: "removed", text: orig, lineNum: i + 1 });
      if (mod !== undefined)
        lines.push({ type: "added", text: mod, lineNum: i + 1 });
    }
  }

  const colorMap = {
    same: "inherit",
    removed: "#f8514933",
    added: "#3fb95033",
  };

  return (
    <pre
      style={{
        fontFamily: "'Cascadia Code', Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.5,
        overflow: "auto",
        margin: 0,
        padding: 8,
        background: "var(--editor-background, #1e1e1e)",
        borderRadius: 4,
      }}
    >
      {lines.map((line, idx) => (
        <div
          key={idx}
          style={{
            background: colorMap[line.type],
            paddingLeft: 4,
            whiteSpace: "pre",
          }}
        >
          <span style={{ opacity: 0.4, marginRight: 8, userSelect: "none" }}>
            {String(line.lineNum).padStart(4)}
          </span>
          <span style={{ marginRight: 4, userSelect: "none" }}>
            {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
          </span>
          {line.text}
        </div>
      ))}
    </pre>
  );
}
