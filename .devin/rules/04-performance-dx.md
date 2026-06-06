---
trigger: always_on
---
# 04 — Performance and DX

## Startup Rule

Use shell-first architecture. The critical startup path should include only:

- Application Shell
- Layout Manager
- minimal Command Palette registry
- workspace selector/recent workspace list
- Monaco minimal loader
- theme/keybinding cache
- Agent panel placeholder

## Lazy Loading Rule

Defer heavy modules until needed:

- full Monaco language workers
- LSP clients
- Wasm parser/indexer/diff modules
- AI provider connectors
- Agent heavy prompts/tools
- Embedded Browser bridge
- Scratchpad templates/runtimes
- Terminal/PTY session manager
- Git integrations
- extension compatibility layer

## Worker-First Rule

Parsing, indexing, search, diff, embeddings, context ranking, and large file scans must avoid blocking the UI thread.

## Cache Rule

- Web cache: IndexedDB/OPFS.
- Desktop cache: SQLite/libSQL.
- Cloud vector/memory: Postgres + pgvector when needed.

Cache theme/keybinding metadata, recent workspaces, workspace tree snapshots, symbol indexes, startup metrics, and non-secret context summaries.

## DX Rule

- Prefer strong TypeScript contracts.
- Keep Rust/Wasm APIs schema-driven.
- Make providers mockable.
- Use deterministic fixtures for Command Bus, Tool Registry, Agent Runtime, Terminal Runtime, Browser Runtime, Scratchpad Runtime, and Context Engine.
