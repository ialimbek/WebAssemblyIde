/**
 * Internal test/benchmark helpers. NOT part of the package's public surface.
 * Reuses the same WASM instance as ./index so that mutable AS module state
 * (e.g., the id counter) is consistent across public and internal callers.
 */

import { getWasmExports, waitForWasm } from "./wasm.js";

export function resetCounter(value = 0): void {
  const exports = getWasmExports();
  if (!exports) return;
  exports.__resetCounter(value | 0);
}

export function getCounter(): number {
  const exports = getWasmExports();
  if (!exports) return 0;
  return exports.__getCounter();
}

export { waitForWasm };
