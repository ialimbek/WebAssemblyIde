# Workflow: Phase E — Wasm, LSP, Indexing, and Context

## Goal

Create Wasm parser/indexer/diff POCs, LSP bridge interfaces, and Context Engine ingestion/ranking strategy.

## Steps

1. Define `wasm-parser`, `wasm-indexer`, and `wasm-diff` API contracts.
2. Plan tree-sitter symbol extraction POC.
3. Define Wasm worker loading and deferred initialization.
4. Define LSP bridge lifecycle and transport model.
5. Connect diagnostics to Problems and Context Engine interfaces.
6. Add Context Engine data source contracts.
7. Add Context Ranker and Budget Optimizer design.
8. Validate worker-first and cache strategies.

## Success Criteria

- Heavy analysis is off the UI thread.
- Context Engine receives workspace, git, terminal, browser, scratchpad, LSP, and diagnostics inputs through clear contracts.
