/**
 * @webassembly-ide/wasm-shared
 *
 * Public API. WebAssembly-backed implementation of pure-compute utilities
 * ported from @webassembly-ide/shared/utils/{id,assert}.ts.
 *
 * The wasm module is instantiated synchronously at module load via
 * top-level await in ./wasm.ts; functions exported here are ordinary
 * synchronous JS functions.
 *
 * Public surface is EXACTLY the four functions that the TS reference exposed
 * — no extras. Test/bench helpers live in ./internal (not re-exported).
 */

import { getWasmExports, liftString, lowerString, waitForWasm } from "./wasm.js";

const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";

export interface WasmScoredItem {
  index: number;
  score: number;
}

export interface WasmPlainTextMatch {
  line: number;
  column: number;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
}

export { waitForWasm };

function withWasm<T>(run: (exports: NonNullable<ReturnType<typeof getWasmExports>>) => T): T | null {
  const exports = getWasmExports();
  return exports ? run(exports) : null;
}

function fallbackScoreMatch(candidate: string, query: string, caseSensitive: boolean): number {
  const c = caseSensitive ? candidate : candidate.toLowerCase();
  const q = caseSensitive ? query : query.toLowerCase();
  if (!q) return 1;
  let score = 0;
  let lastIndex = -1;
  for (const char of q) {
    const index = c.indexOf(char, lastIndex + 1);
    if (index === -1) return 0;
    score += index === lastIndex + 1 ? 3 : 1;
    lastIndex = index;
  }
  return score + q.length / Math.max(c.length, 1);
}

/** Generate a unique ID with optional prefix. WASM-backed. */
export function generateId(prefix = "id"): string {
  const wasmResult = withWasm((exports) => {
    const ptr = lowerString(exports, prefix);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(1);
    const resultPtr = exports.generateId(ptr) >>> 0;
    return liftString(exports, resultPtr) ?? "";
  });
  return wasmResult ?? `${prefix}-${crypto.randomUUID()}`;
}

/** Generate a short ID (8 characters). WASM-backed. */
export function shortId(): string {
  const wasmResult = withWasm((exports) => {
    const resultPtr = exports.shortId() >>> 0;
    return liftString(exports, resultPtr) ?? "";
  });
  return wasmResult ?? crypto.randomUUID().slice(0, 8);
}

/** Assert a condition is true, throw if not. WASM-backed. */
export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (condition) return;
  const wasmResult = withWasm((exports) => {
    const ptr = lowerString(exports, message);
    exports.invariant(0, ptr);
    return true;
  });
  if (!wasmResult) throw new Error(message);
}

/** Exhaustive switch guard. WASM-backed. */
export function assertNever(value: never): never {
  const wasmResult = withWasm((exports) => {
    const ptr = lowerString(exports, JSON.stringify(value));
    exports.assertNever(ptr);
    return true;
  });
  if (!wasmResult) throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
  throw new Error("unreachable");
}

/** Score a palette/search candidate using WASM-backed fuzzy matching. */
export function scoreMatch(
  candidate: string,
  query: string,
  caseSensitive = false,
): number {
  const wasmResult = withWasm((exports) => {
    const candidatePtr = lowerString(exports, candidate);
    const queryPtr = lowerString(exports, query);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(3);
    return exports.scoreMatch(candidatePtr, queryPtr, caseSensitive ? 1 : 0);
  });
  return wasmResult ?? fallbackScoreMatch(candidate, query, caseSensitive);
}

/** Score newline-delimited candidates in WASM and return JS-friendly results. */
export function scoreItemsByQuery(
  candidates: readonly string[],
  query: string,
  limit = 500,
  caseSensitive = false,
): WasmScoredItem[] {
  const encoded = withWasm((exports) => {
    const itemsPtr = lowerString(exports, candidates.join("\n"));
    const queryPtr = lowerString(exports, query);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(4);
    const resultPtr = exports.scoreDelimitedItems(
      itemsPtr,
      queryPtr,
      limit,
      caseSensitive ? 1 : 0,
    ) >>> 0;
    return liftString(exports, resultPtr) ?? "";
  });
  if (encoded === null) {
    return candidates
      .map((candidate, index) => ({ index, score: fallbackScoreMatch(candidate, query, caseSensitive) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, limit);
  }
  if (!encoded) return [];
  return encoded
    .split(RECORD_SEPARATOR)
    .map((record) => {
      const [index, score] = record.split(FIELD_SEPARATOR);
      return { index: Number(index), score: Number(score) };
    })
    .filter((item) => Number.isFinite(item.index) && Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

/** Detect Monaco language id from a file path. WASM-backed. */
export function detectLanguageForPath(path: string): string {
  const wasmResult = withWasm((exports) => {
    const pathPtr = lowerString(exports, path);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(1);
    const resultPtr = exports.detectLanguageForPath(pathPtr) >>> 0;
    return liftString(exports, resultPtr) ?? "plaintext";
  });
  const ext = path.toLowerCase().split(".").pop();
  return wasmResult ?? ({ ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", json: "json", md: "markdown", css: "css", html: "html", rs: "rust", py: "python" }[ext ?? ""] ?? "plaintext");
}

/** Join two path fragments with slash normalization. WASM-backed. */
export function joinPath(parent: string, child: string): string {
  const wasmResult = withWasm((exports) => {
    const parentPtr = lowerString(exports, parent);
    const childPtr = lowerString(exports, child);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(2);
    const resultPtr = exports.joinPath(parentPtr, childPtr) >>> 0;
    return liftString(exports, resultPtr) ?? "";
  });
  return wasmResult ?? `${parent.replace(/\/+$/, "")}/${child.replace(/^\/+/, "")}`;
}

/** Compute a relative path from a workspace root. WASM-backed. */
export function relativePath(path: string, root: string): string {
  const wasmResult = withWasm((exports) => {
    const pathPtr = lowerString(exports, path);
    const rootPtr = lowerString(exports, root);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(2);
    const resultPtr = exports.relativePath(pathPtr, rootPtr) >>> 0;
    return liftString(exports, resultPtr) ?? path;
  });
  const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/, "");
  const normalizedPath = path.replace(/\\/g, "/");
  return wasmResult ?? (normalizedPath.startsWith(`${normalizedRoot}/`) ? normalizedPath.slice(normalizedRoot.length + 1) : path);
}

/** Keep the last N newline-delimited lines. WASM-backed. */
export function lastDelimitedLines(lines: readonly string[], maxLines: number): string[] {
  const wasmResult = withWasm((exports) => {
    const linesPtr = lowerString(exports, lines.join("\n"));
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(2);
    const resultPtr = exports.lastDelimitedLines(linesPtr, maxLines) >>> 0;
    const encoded = liftString(exports, resultPtr) ?? "";
    return encoded ? encoded.split("\n") : [];
  });
  return wasmResult ?? lines.slice(-maxLines);
}

/** Plain text line search for component use. Regex search intentionally stays in JS. */
export function findPlainTextMatches(
  content: string,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean; limit?: number } = {},
): WasmPlainTextMatch[] {
  const limit = options.limit ?? 500;
  const encoded = withWasm((exports) => {
    const contentPtr = lowerString(exports, content);
    const queryPtr = lowerString(exports, query);
    if (exports.__setArgumentsLength) exports.__setArgumentsLength(5);
    const resultPtr = exports.findPlainTextMatches(
      contentPtr,
      queryPtr,
      options.caseSensitive ? 1 : 0,
      options.wholeWord ? 1 : 0,
      limit,
    ) >>> 0;
    return liftString(exports, resultPtr) ?? "";
  });
  if (encoded === null) {
    const needle = options.caseSensitive ? query : query.toLowerCase();
    const word = options.wholeWord ? new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`) : null;
    const matches: WasmPlainTextMatch[] = [];
    content.split(/\r?\n/).some((line, index) => {
      const haystack = options.caseSensitive ? line : line.toLowerCase();
      const column = word ? haystack.search(word) : haystack.indexOf(needle);
      if (column >= 0) matches.push({ line: index + 1, column: column + 1, matchText: line.slice(column, column + query.length), contextBefore: line.slice(0, column), contextAfter: line.slice(column + query.length) });
      return matches.length >= limit;
    });
    return matches;
  }
  if (!encoded) return [];
  return encoded.split(RECORD_SEPARATOR).map((record) => {
    const [line, column, matchText, contextBefore, contextAfter] = record.split(FIELD_SEPARATOR);
    return {
      line: Number(line),
      column: Number(column),
      matchText: matchText ?? "",
      contextBefore: contextBefore ?? "",
      contextAfter: contextAfter ?? "",
    };
  });
}
