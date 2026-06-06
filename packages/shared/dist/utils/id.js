// WebAssembly-backed implementation. Delegates to @webassembly-ide/wasm-shared,
// which compiles assembly/index.ts (AssemblyScript) to a WASM module that is
// instantiated synchronously at module load via top-level await.
//
// Source AS port: packages/wasm-shared/assembly/index.ts
// Public signatures match the previous pure-TS implementation 1:1.
export { generateId, shortId } from "@webassembly-ide/wasm-shared";
//# sourceMappingURL=id.js.map