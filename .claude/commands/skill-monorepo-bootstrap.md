# Skill: Monorepo Bootstrap

Use when bootstrapping the initial project skeleton, creating app/package/crate/service folders, or establishing TypeScript/Rust standards.

Target Structure:
- apps/desktop, apps/web, apps/docs
- packages/ui, packages/editor, packages/ide-core, packages/command-bus, packages/performance-core
- packages/terminal-runtime, packages/browser-runtime, packages/scratchpad-runtime
- packages/agent-runtime, packages/agent-tools, packages/context-engine, packages/ai-gateway
- packages/lsp-client, packages/extension-api, packages/devtools
- packages/i18n, packages/accessibility, packages/settings, packages/notifications
- crates/desktop-host, crates/wasm-parser, crates/wasm-indexer, crates/wasm-diff
- services/api, services/auth, services/token-vault, services/runner

Guardrails:
1. Use local project dependencies; do not assume global tooling.
2. Keep packages independently testable.
3. Follow `TODO.md` → "Minimum Starting Order" for bootstrap order.
4. Mark TODO items complete only when implemented and verified.
