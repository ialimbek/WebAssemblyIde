# WebAssemblyIde — Claude Code Rules

## Project Context

This is a next-generation, AI-native IDE built around:
- Monaco Editor
- Tauri v2 desktop shell
- Rust/Wasm services
- Custom Agent Runtime
- AI Provider Gateway
- Project Terminal Runtime
- Embedded Browser Runtime
- Scratchpad Runtime
- Command Bus and Event Bus based loose coupling

Source of truth:
- `ARCHITECTURE.md` — architecture and product direction
- `TODO.md` — implementation order and task inventory
- `.windsurf/manifest.json` — registered Windsurf resources

Before any architecture, coding, refactor, planning, workflow, or documentation task:
1. Treat `ARCHITECTURE.md` as the source of architectural truth.
2. Treat `TODO.md` as the source of implementation order.
3. Prioritize `TODO.md` → `Minimum Starting Order` for bootstrap work.
4. Do not propose a VS Code/Codium fork as the core strategy.
5. Reuse VS Code/Codium ideas only for compatibility layers (themes, keybindings, snippets, grammars, later extension subsets).

Every implementation plan must state: Goal, Deliverables, Success criteria, Constraints, Affected modules/files, Validation approach.

## Architecture Guardrails

Required layers: Application, Experience Runtime, IDE Core, Intelligence, Execution, Cloud Control Plane.

Coupling rules:
- Modules must communicate through explicit interfaces, Command Bus, Event Bus, or Tool Registry.
- Agent Runtime must not directly mutate workspace files, terminal sessions, browser state, or scratchpad state.
- UI panels must not own core business logic.
- Runtime packages must be independently testable.
- Do not create hidden direct dependencies between terminal, browser, scratchpad, context engine, agent runtime, and AI gateway.

## Operating Protocol

For every task:
1. Read or use context from `ARCHITECTURE.md` and `TODO.md`.
2. State goal, deliverables, success criteria, and constraints.
3. Break task into small verifiable steps.
4. Reference relevant module/file paths and domain concepts.
5. Validate with file checks, tests, lint, build, or structural inspection where possible.

Do not perform destructive operations, global installs, network operations, credential access, or risky shell execution without explicit user approval.

## Security and Permissions

Provider priority: Official API/BYOK → OAuth → Enterprise → Local connector (experimental only).

Never write or log API keys, tokens, secrets, credentials, refresh tokens, or session cookies in plain text.
Use OS keychain on desktop; use backend vault/KMS for web/cloud.
Normalize provider errors without leaking tokens.

Permission levels: Observe → Suggest → Edit → Execute → Autonomous.

Risk classification:
- Low: file reads, listing, search, diff generation
- Medium: source edits, tests, lint, build, local dependency installation
- High: secret access, destructive shell commands, network upload, `git push`, production config changes, browser/session automation

Agent/tool actions must capture: timestamp, tool name, permission/risk level, input/output summary, file changes, user approval state, resulting diff/command status, errors and policy violations.

## Performance and Startup

Critical startup path includes only: App Shell, Layout Manager, minimal Command Palette, workspace selector, Monaco minimal loader, theme/keybinding cache, Agent panel placeholder.

Defer until needed: full Monaco language workers, LSP clients, Wasm modules, AI provider connectors, Agent heavy prompts/tools, Embedded Browser bridge, Scratchpad, Terminal/PTY session manager, Git integrations, extension compatibility layer.

Parsing, indexing, search, diff, embeddings, context ranking, and large file scans must avoid blocking the UI thread (use workers/sidecars).

Cache: IndexedDB/OPFS (web), SQLite/libSQL (desktop), Postgres+pgvector (cloud vector).

Prefer strong TypeScript contracts. Keep Rust/Wasm APIs schema-driven. Make providers mockable.

## Docs and TODO Sync

- Do not mark TODO items done for planning-only changes.
- Mark TODO items done only when implemented and verified.
- If architecture changes, update `ARCHITECTURE.md`.
- If implementation order changes, update `TODO.md`.
- If `.windsurf` resources change, update `.windsurf/manifest.json`.

## Version Update Policy

When new features, bug fixes, or significant changes are added, the version 
MUST be bumped. See `.clinerules/rules/11-version-update-rule.md` for full details.

Files to update: `packages/shared/src/constants/app.ts`, `package.json` (root, web, desktop),
`apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/src-tauri/Cargo.toml`,
`.clinerules/manifest.json`, `.windsurf/manifest.json`.

Follow semantic versioning (MAJOR.MINOR.PATCH). Feature additions default to MINOR bump.

## Accessibility and i18n

All UI components must meet WCAG 2.1 AA:
- Screen reader bridge (NVDA, JAWS, VoiceOver)
- Focus Manager for keyboard navigation
- ARIA Live Region Manager
- Theme Contrast Checker
- Motion reduction support

All user-facing strings must support multiple languages (EN, TR, ES, FR, DE, JA, ZH):
- Do not hardcode user-facing strings; use message keys.
- Ensure all new UI components have ARIA labels and roles.

## Settings, Error Handling, and Updates

Settings hierarchy: Default → Workspace → User → Project.

Application must have error boundaries at: application, panel, editor, Agent Runtime, Terminal Runtime, Browser Runtime, Wasm service levels.

Update channels: Stable, Beta, Nightly/Insiders. Support silent download, install on restart, rollback on failed update.

Auto-save: debounced, on focus loss, on tab close, on shutdown, on crash recovery.

Undo/Redo: Command History Stack supporting file content, file CRUD, agent patches, terminal commands, git operations, and configuration changes.

Notification priority levels: Critical, High, Medium, Low. Support Do Not Disturb mode.

## Skills Reference

Available project skills (see `.agents/skills/`):
- `architecture-planning` — phase-based plans aligned to WebAssemblyIde architecture
- `monorepo-bootstrap` — monorepo folder/package/crate/service bootstrap
- `agent-tools-context` — Agent Runtime, Tool Registry, Context Engine flows
- `terminal-runtime` — PTY bridge, command policy, output parser
- `browser-scratchpad` — Embedded Browser Runtime and Scratchpad Runtime
- `wasm-lsp-indexing` — Rust/Wasm parser/indexer/diff services, LSP bridge
- `ai-gateway-security` — BYOK/OAuth/enterprise provider, Token Vault, Model Router
- `performance-startup` — shell-first startup, lazy loading, worker-first execution
- `review-audit` — architecture alignment, security, performance, TODO/docs sync

Use slash commands for workflows: `/phase-a`, `/phase-b`, `/phase-c`, `/phase-d`, `/phase-e`, `/phase-f`, `/phase-g`, `/review-and-sync`

## Thread Persistence — Mandatory Context Continuity

Every AI agent session MUST follow the thread persistence protocol.

**Thread file**: `.commandcode/thread/THREAD.md`

### Session Start
1. Read `.commandcode/thread/THREAD.md` before ANY work
2. Parse recent entries to recover project context
3. Use this context to inform all actions

### Session End
1. Append a structured entry to `THREAD.md` with:
   - Agent name, exact prompt, full work summary
   - All files read/modified/created/deleted
   - Commands executed, decisions and reasoning
   - Result (success/partial/failed/blocked)
   - Key findings, affected files, next steps

### Subagent Dispatch
1. Extract relevant thread entries from `THREAD.md`
2. Pass as context to EVERY subagent (regardless of origin)
3. Subagent reads context, does work, writes own thread entry
4. Parent integrates subagent results into its entry

### Rules
- ALL subagents use this system — no exceptions
- Never skip thread read at session start
- Never skip thread write at session end
- Never dispatch subagents without thread context
- Never mark work complete without a thread entry
