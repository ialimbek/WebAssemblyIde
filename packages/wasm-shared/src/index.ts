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
