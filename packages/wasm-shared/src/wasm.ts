/**
 * Internal: single instantiation of the AssemblyScript-compiled WASM module.
 * Shared by ./index (public API) and ./internal (test/bench helpers) so that
 * mutable AS module state (e.g., the id counter) is consistent across them.
 *
 * Do NOT import this file from outside the @webassembly-ide/wasm-shared package.
 */

export type AscExports = {
  memory: WebAssembly.Memory;
  __new(size: number, id: number): number;
  __pin(ptr: number): number;
  __unpin(ptr: number): void;
  __collect(): void;
  __setArgumentsLength?(n: number): void;
  generateId(ptr: number): number;
  shortId(): number;
  invariant(cond: number, ptr: number): void;
  assertNever(ptr: number): void;
  __resetCounter(value: number): void;
  __getCounter(): number;
};

export const STRING_ID = 2;

async function loadWasmBytes(): Promise<Uint8Array> {
  const url = new URL("../build/release.wasm", import.meta.url);

  if (
    typeof process !== "undefined" &&
    (process as { versions?: { node?: string; bun?: string } }).versions?.node
  ) {
    const fs = await import("node:fs/promises");
    return new Uint8Array(await fs.readFile(url));
  }

  const resp = await fetch(url);
  return new Uint8Array(await resp.arrayBuffer());
}

// Top-level await: instantiate once at module load. Subsequent imports of
// this file resolve to the same Module Namespace Object and therefore the
// same `exports` binding.
const wasmBytes = await loadWasmBytes();

let exportsRef: AscExports;

const imports: WebAssembly.Imports = {
  env: {
    "Date.now": () => Date.now(),
    abort(
      message: number,
      fileName: number,
      lineNumber: number,
      columnNumber: number,
    ): void {
      const msg = liftString(exportsRef, message >>> 0);
      const file = liftString(exportsRef, fileName >>> 0);
      throw new Error(
        `${msg ?? "abort"} in ${file ?? "?"}:${lineNumber}:${columnNumber}`,
      );
    },
    seed: () => Date.now() * Math.random(),
  },
};

const instantiated = (await WebAssembly.instantiate(
  wasmBytes,
  imports,
)) as unknown as WebAssembly.WebAssemblyInstantiatedSource;

exportsRef = instantiated.instance.exports as unknown as AscExports;

export const exports: AscExports = exportsRef;

// ─── string marshaling (UTF-16 ↔ AS linear memory) ──────────────────────────

export function liftString(exports: AscExports, pointer: number): string | null {
  if (!pointer) return null;
  const view = new DataView(exports.memory.buffer);
  const byteLength = view.getUint32(pointer - 4, true);
  const u16 = new Uint16Array(exports.memory.buffer, pointer, byteLength >>> 1);
  let out = "";
  const CHUNK = 1024;
  for (let i = 0; i < u16.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, u16.length);
    out += String.fromCharCode(...u16.subarray(i, end));
  }
  return out;
}

export function lowerString(exports: AscExports, value: string): number {
  const length = value.length;
  const pointer = exports.__new(length << 1, STRING_ID) >>> 0;
  const u16 = new Uint16Array(exports.memory.buffer, pointer, length);
  for (let i = 0; i < length; i++) u16[i] = value.charCodeAt(i);
  return pointer;
}
