// Head-to-head benchmark: native TypeScript impl vs AssemblyScript-compiled WASM impl.
// Honest comparison of identical-behavior functions from packages/shared/src/utils/{id,assert}.ts
// and packages/wasm-shared/assembly/index.ts.
//
// Output is printed in a table so the user can see exactly what "WASM optimization" buys
// for these specific pure-compute utilities.

import { performance } from "node:perf_hooks";
import {
  generateId as tsGenerateId,
  shortId as tsShortId,
  invariant as tsInvariant,
} from "../../shared/dist/index.js";
import { loadWasmShared } from "../dist/index.js";

const wasm = await loadWasmShared();

const ITER_SMALL = 100_000;
const ITER_LARGE = 1_000_000;
const WARMUP = 10_000;

function bench(label, fn, iter) {
  // Warmup so V8 / Wasm engine reach steady state
  for (let i = 0; i < WARMUP; i++) fn();
  const start = performance.now();
  for (let i = 0; i < iter; i++) fn();
  const elapsed = performance.now() - start;
  const opsPerMs = iter / elapsed;
  return { label, elapsed, opsPerMs, iter };
}

function row(name, ts, ws) {
  const ratio = ts.elapsed / ws.elapsed;
  const winner = ratio > 1 ? "WASM" : "TS";
  const speedup =
    ratio > 1 ? `${ratio.toFixed(2)}x faster` : `${(1 / ratio).toFixed(2)}x slower`;
  return {
    fn: name,
    iter: ts.iter,
    "TS (ms)": ts.elapsed.toFixed(2),
    "WASM (ms)": ws.elapsed.toFixed(2),
    "TS ops/ms": ts.opsPerMs.toFixed(0),
    "WASM ops/ms": ws.opsPerMs.toFixed(0),
    Winner: winner,
    Verdict: `WASM is ${speedup} than TS`,
  };
}

console.log("\n=== wasm-shared benchmark: TS vs AssemblyScript-WASM ===");
console.log(`Node: ${process.version}`);
console.log(`Warmup iterations per case: ${WARMUP}`);
console.log("");

wasm.resetCounter(0);

const results = [];

// generateId
results.push(
  row(
    "generateId('bench')",
    bench("ts", () => tsGenerateId("bench"), ITER_SMALL),
    bench("wasm", () => wasm.generateId("bench"), ITER_SMALL),
  ),
);

// shortId
results.push(
  row(
    "shortId()",
    bench("ts", () => tsShortId(), ITER_LARGE),
    bench("wasm", () => wasm.shortId(), ITER_LARGE),
  ),
);

// invariant (truthy fast path)
results.push(
  row(
    "invariant(true, 'ok')",
    bench("ts", () => tsInvariant(true, "ok"), ITER_LARGE),
    bench("wasm", () => wasm.invariant(1, "ok"), ITER_LARGE),
  ),
);

console.table(results);

const wins = results.filter((r) => r.Winner === "WASM").length;
const losses = results.length - wins;
console.log("");
console.log(
  `Summary: WASM wins ${wins}/${results.length}, TS wins ${losses}/${results.length}`,
);
console.log("");
console.log("Interpretation:");
console.log(
  "  - These functions mostly call JS host APIs (Date.now, Math.random) and",
);
console.log(
  "    return AS strings that must be marshaled across the WASM/JS boundary.",
);
console.log(
  "  - For pure-arithmetic, large-array, or parsing/indexing workloads, WASM",
);
console.log(
  "    typically wins 2-10x. The TS files that fit that profile in this repo",
);
console.log(
  "    are the Rust crates (wasm-parser/indexer/diff), not the JS-glue utils.",
);
console.log("  - This is the exact data ARCHITECTURE.md is built on.");
