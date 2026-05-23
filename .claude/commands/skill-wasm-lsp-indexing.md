# Skill: Wasm, LSP, and Indexing

Use for Rust/Wasm parser/indexer/diff services, tree-sitter POC, LSP bridge, and context indexing.

Wasm Targets: `crates/wasm-parser`, `crates/wasm-indexer`, `crates/wasm-diff`.

Principles:
1. Use Wasm for parsing, indexing, search, AST summaries, and diff helpers.
2. Do not move full terminal/build systems into Wasm.
3. Prefer streaming/deferred initialization.
4. Run heavy analysis in a worker or desktop sidecar.

LSP Model:
- Browser: Web Worker LSP clients, wasm analyzers, optional remote LSP.
- Desktop: native LSP processes via Tauri/Rust process manager.

Validation:
- Are API contracts schema-driven?
- Is there an incremental indexing/cache strategy?
- Is the UI thread being blocked?
