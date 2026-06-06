/**
 * SearchPanel — workspace-wide file content search.
 * Uses workspace manager to search across files with regex support.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useIDE } from "../ide-context.js";
import type { WorkspaceEntry } from "@webassembly-ide/ide-core";
import { useWasmComponentRuntime } from "../hooks/useWasmComponentRuntime.js";

interface SearchResult {
  filePath: string;
  line: number;
  column: number;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
}

interface SearchPanelProps {
  onOpenFile?: (path: string, line: number, column: number) => void;
  /** When true, the replace input is expanded by default (Ctrl+Shift+H entrypoint). */
  defaultReplaceMode?: boolean;
}

type SearchState = "idle" | "searching" | "done" | "error" | "replacing";

export function SearchPanel({ onOpenFile, defaultReplaceMode }: SearchPanelProps) {
  const { workspace } = useIDE();
  const wasm = useWasmComponentRuntime();
  const [query, setQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [showReplace, setShowReplace] = useState(Boolean(defaultReplaceMode));
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setState("idle");
      return;
    }

    setState("searching");
    setError(null);

    try {
      // Build search options
      try {
        const flags = caseSensitive ? "g" : "gi";
        const searchPattern = useRegex
          ? query
          : wholeWord
            ? `\\b${escapeRegex(query)}\\b`
            : escapeRegex(query);
        new RegExp(searchPattern, flags);
      } catch {
        setError("Invalid search pattern");
        setState("error");
        return;
      }

      // Build regex
      const flags = caseSensitive ? "g" : "gi";
      const searchPattern = useRegex
        ? query
        : wholeWord
          ? `\\b${escapeRegex(query)}\\b`
          : escapeRegex(query);
      const regex = new RegExp(searchPattern, flags);

      if (!workspace.isOpen()) {
        setError("Open a workspace before searching files.");
        setState("error");
        return;
      }

      // Recursively scan all files
      const allEntries = await workspace.getTree(6);
      const fileEntries = flattenEntries(allEntries).filter(
        (e) => !e.isDirectory,
      );

      const found: SearchResult[] = [];
      for (const entry of fileEntries) {
        try {
          const { content } = await workspace.readFile(entry.path);
          if (!useRegex) {
            const matches = wasm.findPlainTextMatches(content, query, {
              caseSensitive,
              wholeWord,
              limit: 501 - found.length,
            });
            for (const match of matches) {
              found.push({
                filePath: entry.path,
                line: match.line,
                column: match.column,
                matchText: match.matchText,
                contextBefore: match.contextBefore,
                contextAfter: match.contextAfter,
              });
              if (found.length > 500) break;
            }
          } else {
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              regex.lastIndex = 0;
              const match = regex.exec(line ?? "");
              if (match) {
                found.push({
                  filePath: entry.path,
                  line: i + 1,
                  column: match.index + 1,
                  matchText: match[0],
                  contextBefore: lines[i - 1] ?? "",
                  contextAfter: lines[i + 1] ?? "",
                });
                if (found.length > 500) break;
              }
            }
          }
        } catch {
          /* skip unreadable files */
        }
        if (found.length > 500) break;
      }
      setResults(found);
      setExpandedFiles(new Set(found.map((r) => r.filePath)));
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setState("error");
    }
  }, [query, useRegex, caseSensitive, wholeWord, workspace, wasm]);

  const handleReplaceAll = useCallback(async () => {
    if (!query.trim() || results.length === 0) return;
    setState("replacing");
    setError(null);

    try {
      const flags = caseSensitive ? "g" : "gi";
      const searchPattern = useRegex
        ? query
        : wholeWord
          ? `\\b${escapeRegex(query)}\\b`
          : escapeRegex(query);
      const regex = new RegExp(searchPattern, flags);

      const filePaths = Array.from(new Set(results.map((r) => r.filePath)));
      let replacedFiles = 0;
      for (const filePath of filePaths) {
        try {
          const { content } = await workspace.readFile(filePath);
          const nextContent = content.replace(regex, replaceValue);
          if (nextContent !== content) {
            await workspace.writeFile(filePath, { content: nextContent });
            replacedFiles += 1;
          }
        } catch {
          /* skip unwritable file */
        }
      }
      setResults([]);
      setState("done");
      setError(
        replacedFiles > 0
          ? `Replaced in ${replacedFiles} file(s).`
          : "No replacements were made.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Replace failed");
      setState("error");
    }
  }, [
    caseSensitive,
    query,
    replaceValue,
    results,
    useRegex,
    wholeWord,
    workspace,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (e.shiftKey && showReplace) {
          // Replace next
        } else {
          handleSearch();
        }
      }
      if (e.key === "Escape") {
        setQuery("");
        setResults([]);
        setState("idle");
      }
    },
    [handleSearch, showReplace],
  );

  const toggleFileExpanded = useCallback((path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Group results by file
  const groupedResults = results.reduce<Record<string, SearchResult[]>>(
    (acc, result) => {
      if (!acc[result.filePath]) acc[result.filePath] = [];
      acc[result.filePath].push(result);
      return acc;
    },
    {},
  );

  const fileCount = Object.keys(groupedResults).length;
  const matchCount = results.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--sideBar-background, #252526)",
        color: "var(--sideBar-foreground, #cccccc)",
        fontSize: 13,
      }}
    >
      {/* Search Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 4,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            style={{
              flex: 1,
              padding: "4px 8px",
              background: "var(--input-background, #3c3c3c)",
              border: "1px solid transparent",
              color: "var(--input-foreground, #cccccc)",
              borderRadius: 3,
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            onClick={() => setUseRegex(!useRegex)}
            title="Use Regular Expression"
            style={{
              padding: "4px 6px",
              background: useRegex
                ? "var(--button-background, #0e639c)"
                : "transparent",
              border: "1px solid rgba(128,128,128,0.3)",
              color: "inherit",
              borderRadius: 3,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              opacity: useRegex ? 1 : 0.6,
            }}
          >
            .*
          </button>
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Match Case"
            style={{
              padding: "4px 6px",
              background: caseSensitive
                ? "var(--button-background, #0e639c)"
                : "transparent",
              border: "1px solid rgba(128,128,128,0.3)",
              color: "inherit",
              borderRadius: 3,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              opacity: caseSensitive ? 1 : 0.6,
            }}
          >
            Aa
          </button>
          <button
            onClick={() => setWholeWord(!wholeWord)}
            title="Match Whole Word"
            style={{
              padding: "4px 6px",
              background: wholeWord
                ? "var(--button-background, #0e639c)"
                : "transparent",
              border: "1px solid rgba(128,128,128,0.3)",
              color: "inherit",
              borderRadius: 3,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              opacity: wholeWord ? 1 : 0.6,
            }}
          >
            Ab
          </button>
        </div>

        {/* Replace toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setShowReplace(!showReplace)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: 11,
              padding: "2px 4px",
              opacity: 0.7,
            }}
          >
            {showReplace ? "▼" : "▶"} Replace
          </button>
        </div>

        {showReplace && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <input
              type="text"
              value={replaceValue}
              onChange={(e) => setReplaceValue(e.target.value)}
              placeholder="Replace..."
              style={{
                flex: 1,
                padding: "4px 8px",
                background: "var(--input-background, #3c3c3c)",
                border: "1px solid transparent",
                color: "var(--input-foreground, #cccccc)",
                borderRadius: 3,
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              title="Replace All"
              onClick={() => void handleReplaceAll()}
              disabled={results.length === 0 || state === "replacing"}
              style={{
                padding: "4px 8px",
                background:
                  results.length === 0
                    ? "transparent"
                    : "var(--button-background, #0e639c)",
                border: "1px solid rgba(128,128,128,0.3)",
                color: "inherit",
                borderRadius: 3,
                cursor: results.length === 0 ? "default" : "pointer",
                fontSize: 11,
                opacity: results.length === 0 ? 0.4 : 1,
              }}
            >
              {state === "replacing" ? "..." : "All"}
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      {state === "done" && (
        <div
          style={{
            padding: "4px 12px",
            fontSize: 11,
            opacity: 0.6,
            borderBottom: "1px solid rgba(128,128,128,0.1)",
          }}
        >
          {matchCount} results in {fileCount} files
        </div>
      )}

      {state === "searching" && (
        <div style={{ padding: "8px 12px", fontSize: 12, opacity: 0.6 }}>
          Searching...
        </div>
      )}

      {state === "replacing" && (
        <div style={{ padding: "8px 12px", fontSize: 12, opacity: 0.6 }}>
          Replacing...
        </div>
      )}

      {error && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: "#f85149" }}>
          {error}
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {Object.entries(groupedResults).map(([filePath, fileResults]) => {
          const isExpanded = expandedFiles.has(filePath);
          const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
          return (
            <div key={filePath}>
              <div
                onClick={() => toggleFileExpanded(filePath)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: 10, width: 12 }}>
                  {isExpanded ? "▼" : "▶"}
                </span>
                <span>{fileName}</span>
                <span
                  style={{ opacity: 0.5, fontSize: 11, marginLeft: "auto" }}
                >
                  {fileResults.length}
                </span>
              </div>
              {isExpanded &&
                fileResults.map((result, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      onOpenFile?.(result.filePath, result.line, result.column)
                    }
                    style={{
                      padding: "2px 12px 2px 28px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(128,128,128,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <span style={{ opacity: 0.5, marginRight: 8 }}>
                      {result.line}:
                    </span>
                    <span style={{ opacity: 0.6 }}>{result.contextBefore}</span>
                    <span style={{ color: "#e2c08d", fontWeight: 600 }}>
                      {result.matchText}
                    </span>
                    <span style={{ opacity: 0.6 }}>{result.contextAfter}</span>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function flattenEntries(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  const result: WorkspaceEntry[] = [];
  for (const e of entries) {
    result.push(e);
    if (e.isDirectory && e.children) {
      result.push(...flattenEntries(e.children));
    }
  }
  return result;
}
