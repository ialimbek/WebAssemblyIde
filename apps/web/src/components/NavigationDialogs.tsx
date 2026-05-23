/**
 * Lightweight dedicated dialogs for Go to Line and Go to Symbol.
 *
 * These replace the previous "open Quick Open" placeholder behaviour so the
 * Ctrl+G and Ctrl+Shift+O shortcuts give real, predictable navigation in the
 * active editor.
 */

import { useEffect, useMemo, useRef, useState } from "react";

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  justifyContent: "center",
  paddingTop: "15vh",
  background: "rgba(0,0,0,0.4)",
};

const cardStyle: React.CSSProperties = {
  width: 480,
  maxWidth: "90vw",
  background: "var(--dropdown-background, #252526)",
  border: "1px solid rgba(128,128,128,0.3)",
  borderRadius: 6,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  display: "flex",
  flexDirection: "column",
  maxHeight: "60vh",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "var(--input-foreground, #cccccc)",
  fontSize: 14,
  outline: "none",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid rgba(128,128,128,0.2)",
};

export interface GoToLineDialogProps {
  totalLines: number;
  initialLine?: number;
  onAccept: (line: number, column: number) => void;
  onClose: () => void;
}

export function GoToLineDialog({
  totalLines,
  initialLine = 1,
  onAccept,
  onClose,
}: GoToLineDialogProps) {
  const [value, setValue] = useState(String(initialLine));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const parsed = useMemo(() => parseLineExpr(value, totalLines), [
    totalLines,
    value,
  ]);

  return (
    <div
      role="dialog"
      aria-label="Go to Line"
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={inputRowStyle}>
          <span
            aria-hidden="true"
            style={{ opacity: 0.5, marginRight: 8, fontSize: 14 }}
          >
            ⇒
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value}
            placeholder="Go to line (e.g. 42 or 42:5)"
            aria-label="Line number"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (parsed) {
                  onAccept(parsed.line, parsed.column);
                  onClose();
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            style={inputStyle}
          />
          <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 8 }}>
            of {totalLines}
          </span>
        </div>
        <div style={{ padding: "10px 14px", fontSize: 12, color: "#a0a0a0" }}>
          {parsed
            ? `Jump to line ${parsed.line}, column ${parsed.column}`
            : "Enter a line number (e.g. 42) or line:column (e.g. 42:5)."}
        </div>
      </div>
    </div>
  );
}

export interface SymbolItem {
  name: string;
  detail?: string;
  line: number;
  column: number;
  kind?: string;
}

export interface GoToSymbolDialogProps {
  symbols: SymbolItem[];
  onAccept: (line: number, column: number) => void;
  onClose: () => void;
}

export function GoToSymbolDialog({
  symbols,
  onAccept,
  onClose,
}: GoToSymbolDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return symbols;
    return symbols.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.detail?.toLowerCase().includes(q) ||
        s.kind?.toLowerCase().includes(q),
    );
  }, [query, symbols]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <div
      role="dialog"
      aria-label="Go to Symbol"
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={inputRowStyle}>
          <span
            aria-hidden="true"
            style={{ opacity: 0.5, marginRight: 8, fontSize: 14 }}
          >
            @
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Type to filter symbols…"
            aria-label="Symbol filter"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const target = filtered[selectedIndex];
                if (target) {
                  onAccept(target.line, target.column);
                  onClose();
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 16,
                textAlign: "center",
                opacity: 0.5,
                fontSize: 13,
              }}
            >
              {symbols.length === 0
                ? "No symbols detected in the active file."
                : "No matches."}
            </div>
          ) : (
            filtered.map((symbol, index) => (
              <button
                key={`${symbol.line}-${symbol.column}-${symbol.name}-${index}`}
                type="button"
                data-index={index}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  onAccept(symbol.line, symbol.column);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background:
                    index === selectedIndex
                      ? "var(--list-activeSelectionBackground, #094771)"
                      : "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <span style={{ width: 28, opacity: 0.6 }}>
                  {symbol.kind ?? "·"}
                </span>
                <span style={{ flex: 1 }}>{symbol.name}</span>
                {symbol.detail && (
                  <span style={{ opacity: 0.4, fontSize: 11 }}>
                    {symbol.detail}
                  </span>
                )}
                <span style={{ opacity: 0.5, fontSize: 11 }}>
                  L{symbol.line}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function parseLineExpr(
  value: string,
  totalLines: number,
): { line: number; column: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d+)(?::(\d+))?$/.exec(trimmed);
  if (!match) return null;
  const line = Math.min(Math.max(1, parseInt(match[1], 10)), Math.max(1, totalLines));
  const column = match[2] ? Math.max(1, parseInt(match[2], 10)) : 1;
  return { line, column };
}

const SYMBOL_PATTERNS: Array<{
  regex: RegExp;
  kind: string;
  group?: number;
}> = [
  // TS/JS function declarations
  {
    regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm,
    kind: "ƒ",
  },
  // TS/JS class declarations
  { regex: /^\s*(?:export\s+)?class\s+([A-Za-z0-9_$]+)/gm, kind: "𝓒" },
  // TS interface / type
  { regex: /^\s*(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/gm, kind: "ℐ" },
  { regex: /^\s*(?:export\s+)?type\s+([A-Za-z0-9_$]+)/gm, kind: "𝓣" },
  // TS/JS const/let/var top-level
  {
    regex:
      /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\bfunction\b)/gm,
    kind: "ƒ",
  },
  { regex: /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)/gm, kind: "𝓥" },
  // Rust fn/struct/enum/trait/impl
  { regex: /^\s*(?:pub\s+)?fn\s+([A-Za-z0-9_]+)/gm, kind: "ƒ" },
  { regex: /^\s*(?:pub\s+)?struct\s+([A-Za-z0-9_]+)/gm, kind: "𝓢" },
  { regex: /^\s*(?:pub\s+)?enum\s+([A-Za-z0-9_]+)/gm, kind: "𝓔" },
  { regex: /^\s*(?:pub\s+)?trait\s+([A-Za-z0-9_]+)/gm, kind: "𝓣" },
  { regex: /^\s*impl(?:\s+[^{]+)?\s+for\s+([A-Za-z0-9_]+)/gm, kind: "⚙" },
  // Python def/class
  { regex: /^\s*def\s+([A-Za-z0-9_]+)/gm, kind: "ƒ" },
  { regex: /^\s*class\s+([A-Za-z0-9_]+)/gm, kind: "𝓒" },
  // Markdown headings
  { regex: /^(#{1,6})\s+(.+)$/gm, kind: "§", group: 2 },
];

/**
 * Parse top-level symbols from a text buffer using regex heuristics.
 * Intentionally conservative — handles the common cases for TS/JS, Rust,
 * Python, and Markdown without pulling a full LSP into the bundle.
 */
export function parseSymbolsFromText(content: string): SymbolItem[] {
  const results: SymbolItem[] = [];
  const seen = new Set<string>();

  for (const { regex, kind, group } of SYMBOL_PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const name = match[group ?? 1];
      if (!name) continue;

      const before = content.slice(0, match.index);
      const line = before.split("\n").length;
      const column = match.index - before.lastIndexOf("\n");
      const key = `${kind}:${name}:${line}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({ name, line, column: Math.max(1, column), kind });
    }
  }

  results.sort((a, b) => a.line - b.line || a.column - b.column);
  return results;
}
