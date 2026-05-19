---
name: wasm-lsp-indexing
description: Rust/Wasm parser-indexer-diff servisleri, tree-sitter POC, LSP bridge ve context indexing için kullanılır.
---

# Wasm, LSP and Indexing

## Wasm Targets

- `crates/wasm-parser`
- `crates/wasm-indexer`
- `crates/wasm-diff`

## Principles

1. Parser, index, search, AST summary ve diff helper işlerinde Wasm kullan.
2. Tam terminal/build sistemlerini Wasm’a taşımaya çalışma.
3. Streaming/deferred initialization tercih et.
4. Ağır analizleri worker veya desktop sidecar tarafında çalıştır.

## LSP Model

- Browser: Web Worker LSP clients, wasm analyzers, optional remote LSP.
- Desktop: native LSP processes via Tauri/Rust process manager.

## Validation

- API sözleşmeleri schema-driven mı?
- Incremental indexing/cache stratejisi var mı?
- UI thread bloklanıyor mu?
