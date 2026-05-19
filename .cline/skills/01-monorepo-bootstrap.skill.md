# Skill: Monorepo Bootstrap

## Use When

- Creating the initial repo structure.
- Adding apps, packages, crates, or services.
- Establishing TypeScript/Rust project standards.

## Target Structure

- `apps/desktop`
- `apps/web`
- `apps/docs`
- `packages/ui`
- `packages/editor`
- `packages/ide-core`
- `packages/command-bus`
- `packages/performance-core`
- `packages/terminal-runtime`
- `packages/browser-runtime`
- `packages/scratchpad-runtime`
- `packages/agent-runtime`
- `packages/agent-tools`
- `packages/context-engine`
- `packages/ai-gateway`
- `packages/lsp-client`
- `packages/extension-api`
- `packages/devtools`
- `crates/desktop-host`
- `crates/wasm-parser`
- `crates/wasm-indexer`
- `crates/wasm-diff`
- `services/api`
- `services/auth`
- `services/token-vault`
- `services/runner`

## Guardrails

- Use local project dependencies only.
- Do not assume global scaffolding tools.
- Keep packages independently buildable/testable where possible.
- Do not mark TODO items complete until the structure is created and verified.
