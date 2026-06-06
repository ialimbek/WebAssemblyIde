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

import { exports, liftString, lowerString } from "./wasm.js";

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

/** Generate a unique ID with optional prefix. WASM-backed. */
export function generateId(prefix = "id"): string {
  const ptr = lowerString(exports, prefix);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(1);
  const resultPtr = exports.generateId(ptr) >>> 0;
  return liftString(exports, resultPtr) ?? "";
}

/** Generate a short ID (8 characters). WASM-backed. */
export function shortId(): string {
  const resultPtr = exports.shortId() >>> 0;
  return liftString(exports, resultPtr) ?? "";
}

/** Assert a condition is true, throw if not. WASM-backed. */
export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  const cond = condition ? 1 : 0;
  const ptr = lowerString(exports, message);
  exports.invariant(cond, ptr);
}

/** Exhaustive switch guard. WASM-backed. */
export function assertNever(value: never): never {
  const ptr = lowerString(exports, JSON.stringify(value));
  exports.assertNever(ptr);
  throw new Error("unreachable");
}

/** Score a palette/search candidate using WASM-backed fuzzy matching. */
export function scoreMatch(
  candidate: string,
  query: string,
  caseSensitive = false,
): number {
  const candidatePtr = lowerString(exports, candidate);
  const queryPtr = lowerString(exports, query);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(3);
  return exports.scoreMatch(candidatePtr, queryPtr, caseSensitive ? 1 : 0);
}

/** Score newline-delimited candidates in WASM and return JS-friendly results. */
export function scoreItemsByQuery(
  candidates: readonly string[],
  query: string,
  limit = 500,
  caseSensitive = false,
): WasmScoredItem[] {
  const itemsPtr = lowerString(exports, candidates.join("\n"));
  const queryPtr = lowerString(exports, query);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(4);
  const resultPtr = exports.scoreDelimitedItems(
    itemsPtr,
    queryPtr,
    limit,
    caseSensitive ? 1 : 0,
  ) >>> 0;
  const encoded = liftString(exports, resultPtr) ?? "";
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
  const pathPtr = lowerString(exports, path);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(1);
  const resultPtr = exports.detectLanguageForPath(pathPtr) >>> 0;
  return liftString(exports, resultPtr) ?? "plaintext";
}

/** Join two path fragments with slash normalization. WASM-backed. */
export function joinPath(parent: string, child: string): string {
  const parentPtr = lowerString(exports, parent);
  const childPtr = lowerString(exports, child);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(2);
  const resultPtr = exports.joinPath(parentPtr, childPtr) >>> 0;
  return liftString(exports, resultPtr) ?? "";
}

/** Compute a relative path from a workspace root. WASM-backed. */
export function relativePath(path: string, root: string): string {
  const pathPtr = lowerString(exports, path);
  const rootPtr = lowerString(exports, root);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(2);
  const resultPtr = exports.relativePath(pathPtr, rootPtr) >>> 0;
  return liftString(exports, resultPtr) ?? path;
}

/** Keep the last N newline-delimited lines. WASM-backed. */
export function lastDelimitedLines(lines: readonly string[], maxLines: number): string[] {
  const linesPtr = lowerString(exports, lines.join("\n"));
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(2);
  const resultPtr = exports.lastDelimitedLines(linesPtr, maxLines) >>> 0;
  const encoded = liftString(exports, resultPtr) ?? "";
  return encoded ? encoded.split("\n") : [];
}

/** Plain text line search for component use. Regex search intentionally stays in JS. */
export function findPlainTextMatches(
  content: string,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean; limit?: number } = {},
): WasmPlainTextMatch[] {
  const contentPtr = lowerString(exports, content);
  const queryPtr = lowerString(exports, query);
  if (exports.__setArgumentsLength) exports.__setArgumentsLength(5);
  const resultPtr = exports.findPlainTextMatches(
    contentPtr,
    queryPtr,
    options.caseSensitive ? 1 : 0,
    options.wholeWord ? 1 : 0,
    options.limit ?? 500,
  ) >>> 0;
  const encoded = liftString(exports, resultPtr) ?? "";
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
