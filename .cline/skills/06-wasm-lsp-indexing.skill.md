# Skill: Wasm, LSP, and Indexing

## Use When

- Designing Wasm parser/indexer/diff crates.
- Implementing tree-sitter symbol extraction.
- Creating LSP bridge interfaces.

## Wasm Targets

- `crates/wasm-parser`
- `crates/wasm-indexer`
- `crates/wasm-diff`

## Principles

- Use Wasm for parser, index, search, AST summary, and diff helpers.
- Avoid moving full terminal/build systems into Wasm.
- Use streaming/deferred initialization where possible.
- Run heavy analysis in workers or sidecars.

## LSP Model

- Browser: Web Worker LSP clients, wasm analyzers, optional remote LSP.
- Desktop: native LSP processes via Tauri/Rust process manager.

## Validation

- Confirm APIs are schema-defined.
- Confirm worker-first execution.
- Confirm incremental indexing/cache strategy.
