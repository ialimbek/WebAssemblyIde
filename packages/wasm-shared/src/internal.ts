/**
 * Internal test/benchmark helpers. NOT part of the package's public surface.
 * Reuses the same WASM instance as ./index so that mutable AS module state
 * (e.g., the id counter) is consistent across public and internal callers.
 */

import { exports } from "./wasm.js";

export function resetCounter(value = 0): void {
  exports.__resetCounter(value | 0);
}

export function getCounter(): number {
  return exports.__getCounter();
}
