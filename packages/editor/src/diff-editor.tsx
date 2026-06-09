/**
 * DiffEditor — Monaco-based diff viewer for patch preview.
 * Shows side-by-side or inline diff between original and modified content.
 */

import React, { useEffect, useRef, useCallback, useState } from "react";
import { defineMonacoTheme } from "./monaco-theme-adapter.js";
import { loadMonacoLanguageForFile } from "./monaco-languages.js";
import type { ThemeManager } from "@webassembly-ide/ide-core";

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
  /** Shared IDE theme manager for custom Monaco theme registration. */
  themeManager?: ThemeManager;
  /** Optional source path used to create stable in-memory diff model URIs. */
  uri?: string;
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
      themeManager,
      uri,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const originalModelRef = useRef<any>(null);
    const modifiedModelRef = useRef<any>(null);
    const instanceIdRef = useRef(`diff-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const [monacoFailed, setMonacoFailed] = useState(false);

    // Lazy load Monaco
    useEffect(() => {
      if (!containerRef.current) return;

      let disposed = false;

      const loadMonaco = async () => {
        try {
          const monaco = await import("monaco-editor");
          await loadMonacoLanguageForFile(language);
          if (disposed || !containerRef.current) return;

          monacoRef.current = monaco;
          if (themeManager) {
            for (const theme of themeManager.listThemes()) {
              defineMonacoTheme(monaco, theme);
            }
          }
          const activeTheme = themeManager?.getActiveTheme();

          const editor = monaco.editor.createDiffEditor(containerRef.current, {
            readOnly,
            renderSideBySide: !inline,
            enableSplitViewResizing: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: {
              vertical: "visible",
              horizontal: "auto",
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
              alwaysConsumeMouseWheel: false,
            },
            smoothScrolling: true,
            fontSize: 13,
            fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
            theme: activeTheme?.id ??
              (document.documentElement.getAttribute("data-theme") === "light"
                ? "vs"
                : "vs-dark"),
          });

          const modelPath = encodeURIComponent(uri ?? instanceIdRef.current);
          const originalModel = monaco.editor.createModel(
            original,
            language,
            monaco.Uri.parse(`inmemory://diff/${instanceIdRef.current}/original/${modelPath}`),
          );
          const modifiedModel = monaco.editor.createModel(
            modified,
            language,
            monaco.Uri.parse(`inmemory://diff/${instanceIdRef.current}/modified/${modelPath}`),
          );
          originalModelRef.current = originalModel;
          modifiedModelRef.current = modifiedModel;

          editor.setModel({
            original: originalModel,
            modified: modifiedModel,
          });

          editorRef.current = editor;
          setMonacoFailed(false);

          const forceLayout = () => {
            if (!editorRef.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            editorRef.current.layout({
              width: rect.width || containerRef.current.offsetWidth,
              height: rect.height || containerRef.current.offsetHeight,
            });
          };
          requestAnimationFrame(() => {
            forceLayout();
            requestAnimationFrame(() => {
              forceLayout();
              setTimeout(forceLayout, 100);
              setTimeout(forceLayout, 300);
            });
          });
          if (typeof ResizeObserver !== "undefined" && containerRef.current) {
            const ro = new ResizeObserver(forceLayout);
            ro.observe(containerRef.current);
            (editor as any).__ideResizeObserver = ro;
          }
        } catch {
          // Monaco not available — show fallback
          setMonacoFailed(true);
        }
      };

      loadMonaco();

      return () => {
        disposed = true;
        if (editorRef.current) {
          (editorRef.current as any).__ideResizeObserver?.disconnect?.();
          editorRef.current.dispose();
          editorRef.current = null;
        }
        originalModelRef.current?.dispose?.();
        modifiedModelRef.current?.dispose?.();
        originalModelRef.current = null;
        modifiedModelRef.current = null;
      };
    }, [themeManager, uri]);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.updateOptions({
        readOnly,
        renderSideBySide: !inline,
      });
      editor.layout();
    }, [inline, readOnly]);

    useEffect(() => {
      if (!themeManager) return undefined;
      const applyTheme = () => {
        const monaco = monacoRef.current;
        const editor = editorRef.current;
        if (!monaco || !editor) return;
        const theme = themeManager.getActiveTheme();
        defineMonacoTheme(monaco, theme);
        monaco.editor.setTheme(theme.id);
      };
      applyTheme();
      return themeManager.onThemeChange(() => applyTheme());
    }, [themeManager]);

    // Update models when props change
    // Sync content when original/modified/language change
    useEffect(() => {
      if (!editorRef.current || !monacoRef.current) return;
      const origModel = originalModelRef.current;
      const modModel = modifiedModelRef.current;
      if (origModel && origModel.getValue() !== original) {
        origModel.setValue(original);
      }
      if (modModel && modModel.getValue() !== modified) {
        modModel.setValue(modified);
      }
      if (origModel) {
        monacoRef.current.editor.setModelLanguage(origModel, language);
      }
      if (modModel) {
        monacoRef.current.editor.setModelLanguage(modModel, language);
      }
    }, [language, original, modified]);

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
    if (monacoFailed) {
      return (
        <div className={className} style={{ height: "100%", minHeight: 0, padding: 16, overflow: "hidden" }}>
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
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
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
        <div ref={containerRef} style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" }} />
      </div>
    );
  },
);

DiffEditor.displayName = "DiffEditor";

/** LCS-based diff algorithm */
function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from(
    { length: m + 1 },
    () => new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

interface DiffLine {
  type: "same" | "removed" | "added";
  text: string;
  origLine?: number;
  modLine?: number;
}

function buildDiffLines(
  origLines: string[],
  modLines: string[],
): DiffLine[] {
  if (origLines.length * modLines.length > 1_000_000) {
    const maxLen = Math.max(origLines.length, modLines.length);
    const result: DiffLine[] = [];
    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i];
      const mod = modLines[i];
      if (orig === mod) {
        result.push({
          type: "same",
          text: orig ?? "",
          origLine: i + 1,
          modLine: i + 1,
        });
      } else {
        if (orig !== undefined)
          result.push({ type: "removed", text: orig, origLine: i + 1 });
        if (mod !== undefined)
          result.push({ type: "added", text: mod, modLine: i + 1 });
      }
    }
    return result;
  }

  const dp = computeLCS(origLines, modLines);
  const stack: DiffLine[] = [];
  let i = origLines.length;
  let j = modLines.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      stack.push({
        type: "same",
        text: origLines[i - 1],
        origLine: i,
        modLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", text: modLines[j - 1], modLine: j });
      j--;
    } else {
      stack.push({ type: "removed", text: origLines[i - 1], origLine: i });
      i--;
    }
  }
  stack.reverse();
  return stack;
}

/** Simple split-panel fallback diff renderer. */
function FallbackDiff({
  original,
  modified,
}: {
  original: string;
  modified: string;
}) {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  const lines = buildDiffLines(origLines, modLines);

  const originalRows = lines.filter((line) => line.type !== "added");
  const modifiedRows = lines.filter((line) => line.type !== "removed");
  const maxRows = Math.max(originalRows.length, modifiedRows.length);
  const rows = Array.from({ length: maxRows }, (_, idx) => ({
    original: originalRows[idx],
    modified: modifiedRows[idx],
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        height: "calc(100% - 28px)",
        minHeight: 0,
        overflow: "auto",
        border: "1px solid var(--sideBar-border, #333333)",
        borderRadius: 4,
        fontFamily: "'Cascadia Code', Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.5,
        background: "var(--editor-background, #1e1e1e)",
      }}
    >
      <div style={{ minWidth: 420, borderRight: "1px solid var(--sideBar-border, #333333)" }}>
        {rows.map((row, idx) => renderFallbackLine(row.original, idx, "original"))}
      </div>
      <div style={{ minWidth: 420 }}>
        {rows.map((row, idx) => renderFallbackLine(row.modified, idx, "modified"))}
      </div>
    </div>
  );
}

function renderFallbackLine(
  line: DiffLine | undefined,
  idx: number,
  side: "original" | "modified",
) {
  const isRemoved = line?.type === "removed";
  const isAdded = line?.type === "added";
  const lineNo = side === "original" ? line?.origLine : line?.modLine;
  return (
    <div
      key={`${side}-${idx}`}
      style={{
        display: "grid",
        gridTemplateColumns: "56px 18px minmax(max-content, 1fr)",
        minHeight: "1.5em",
        background: isRemoved ? "#f8514933" : isAdded ? "#3fb95033" : "transparent",
        color: "var(--editor-foreground, inherit)",
        whiteSpace: "pre",
      }}
    >
      <span style={{ opacity: 0.45, paddingRight: 8, textAlign: "right", userSelect: "none" }}>
        {lineNo ? String(lineNo).padStart(4) : ""}
      </span>
      <span style={{ userSelect: "none", color: isRemoved ? "#f85149" : isAdded ? "#3fb950" : "inherit" }}>
        {isRemoved ? "-" : isAdded ? "+" : " "}
      </span>
      <span>{line?.text ?? ""}</span>
    </div>
  );
}
