# Phase E — Wasm, LSP, Indexing, and Context

Goal: Create Wasm parser/indexer/diff POCs, LSP bridge interfaces, and Context Engine ingestion/ranking strategy.

Steps:
1. Define `wasm-parser`, `wasm-indexer`, and `wasm-diff` API contracts (see TODO.md 2.15).
2. Plan tree-sitter symbol extraction POC (see TODO.md 2.15).
3. Define Wasm worker loading and deferred initialization (see TODO.md 2.15).
4. Define LSP bridge lifecycle and transport model (see TODO.md 2.16).
5. Connect diagnostics to Problems and Context Engine interfaces (see TODO.md 2.16).
6. Add Context Engine data source contracts (see TODO.md 2.14).
7. Add Context Ranker and Budget Optimizer design (see TODO.md 2.14).
8. Validate worker-first and cache strategies (see TODO.md 2.14, 2.15).
9. Add Git integration (see TODO.md 2.20).

Success Criteria:
- Heavy analysis is off the UI thread.
- Context Engine receives workspace, git, terminal, browser, scratchpad, LSP, and diagnostics inputs through clear contracts.
- Git integration connected to Context Engine.
