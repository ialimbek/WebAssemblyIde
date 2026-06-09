# Comprehensive Codembly Architecture

## Agent Tools and Context

### Agent Modes
- Chat Mode
- Plan Mode
- Limited Act Mode
- Review Mode
- Architect Mode

### Core Tools
- `read_file`
- `write_file`
- `apply_patch`
- `search_files`
- `list_files`
- `run_command`
- `git_diff`
- `run_tests`
- `open_preview`
- `reload_preview`
- `collect_console_logs`
- `collect_network_errors`
- `capture_screenshot`
- `scratchpad_execute`
- `lsp_diagnostics`
- `package_manager`

### Context Sources
- Workspace scanner
- Symbol index
- Dependency graph
- Git diff/status
- Terminal output
- Browser logs/screenshots
- Scratchpad results
- Diagnostics/errors
- Recent files
- Error/diagnostic context

### Rule
Agent Runtime orchestrates; actual operations are executed through the Tool Registry and runtime modules.

## AI Gateway and Security

### Provider Priority
1. Official API / BYOK
2. Official OAuth providers
3. Enterprise-managed providers
4. Local user connector as experimental only

### Model Router Criteria
- context window
- tool calling support
- cost
- latency
- privacy level
- coding capability
- user preference
- task risk level

### Security Rules
- Never write or log secrets/tokens/API keys in plain text.
- Use OS keychain on desktop; use backend vault/KMS for web/cloud.
- Normalize provider errors without leaking tokens.
- Audit token access and provider calls using safe summaries.

## Architecture Planning

### Usage
Use when you need an architecture decision, refactor plan, package boundary design, workflow design, or a large implementation plan.

### Required Context
- `ARCHITECTURE.md`
- `TODO.md`
- `.clinerules/default-rules.md`
- `.clinerules/rules/*`
- `.devin/rules/*`

### Steps
1. Map the request to `TODO.md` phases A–G.
2. Identify affected architecture layers.
3. Define goal, deliverables, success criteria, constraints, and validation.
4. Preserve Command Bus, Event Bus, Tool Registry, and explicit interface boundaries.
5. Call out security, performance, startup, and cache implications.

### Output
- Phase-based actionable plan
- Affected modules/files list
- Risks and mitigations
- Validation approach

## Monorepo Bootstrap

### Usage
Use when bootstrapping the initial project skeleton, creating app/package/crate/service folders, or establishing TypeScript/Rust standards.

### Target Structure
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
- `packages/i18n`
- `packages/accessibility`
- `packages/settings`
- `packages/notifications`
- `crates/desktop-host`
- `crates/wasm-parser`
- `crates/wasm-indexer`
- `crates/wasm-diff`
- `services/api`
- `services/auth`
- `services/token-vault`
- `services/runner`

### Guardrails
1. Use local project dependencies; do not assume global tooling.
2. Keep packages independently testable.
3. Follow `TODO.md` → "Minimum Starting Order" for bootstrap order.
4. Mark TODO items complete only when implemented and verified.

## Performance and Startup

### Usage
Use when designing `performance-core`, panel lazy loading, cache strategy, or startup measurement points.

### Steps
1. Decide whether a module belongs in the critical startup path or the lazy path.
2. Keep heavy services out of the first render.
3. Consider metrics: first paint, interactive startup, workspace tree visible, first file open, Monaco ready, terminal ready, browser preview ready, agent ready, indexing completion.
4. Recommend IndexedDB/OPFS or SQLite/libSQL caching for non-secret metadata/context.
5. Move CPU-heavy work into a worker/sidecar.

### Validation
- Are lazy import boundaries clear?
- Are heavy Wasm/LSP/AI/terminal/browser loads removed from the startup path?
- Is the UI thread being blocked?

## Embedded Browser and Scratchpad

### Browser Runtime Requirements
- Browser Panel UI
- Preview Session Manager
- Navigation Controller
- Dev Server Connector
- Console Log Collector
- Network Event Collector
- Screenshot/DOM summary adapter
- Browser Security Boundary
- Agent browser tool adapter

### Scratchpad Runtime Requirements
- Scratchpad Editor
- Temporary File System
- Runtime Template Registry
- Execution Adapter
- Result Panel
- Isolation Guard
- Agent scratchpad tool adapter

### Safety Rules
1. Browser introspection requires explicit permission.
2. Scratchpad must not write to the real workspace by default.
3. Scratchpad export/apply to workspace requires user approval.

## Project Terminal Runtime

### Terminal Types
- User Terminal
- Agent Terminal
- Task Terminal
- Scratchpad Terminal

### Required Components
1. Terminal Session Manager
2. Shell Profile Resolver
3. PTY Bridge
4. Command Policy Guard
5. Working Directory Guard
6. Output Stream Parser
7. Task Runner integration
8. Context Engine ingestion
9. Audit Log integration
10. Test/lint/build output parser

### Safety Rules
- Agent commands must go through the Tool Registry.
- Risky commands must be blocked by policy or require explicit user approval.
- Terminal output must not be injected raw into prompts; it should be safely summarized.

## Wasm, LSP and Indexing

### Wasm Targets
- `crates/wasm-parser`
- `crates/wasm-indexer`
- `crates/wasm-diff`

### Principles
1. Use Wasm for parsing, indexing, search, AST summaries, and diff helpers.
2. Do not move full terminal/build systems into Wasm.
3. Prefer streaming/deferred initialization.
4. Run heavy analysis in a worker or desktop sidecar.

### LSP Model
- Browser: Web Worker LSP clients, wasm analyzers, optional remote LSP.
- Desktop: native LSP processes via Tauri/Rust process manager.

### Validation
- Are API contracts schema-driven?
- Is there an incremental indexing/cache strategy?
- Is the UI thread being blocked?

## Review and Audit

### Checklist
- Is the change aligned with `ARCHITECTURE.md`?
- Are module boundaries preserved?
- Does Agent Runtime orchestrate via Tool Registry rather than producing direct side effects?
- Are permission, risk, and audit paths explicit?
- Are startup/lazy loading constraints respected?
- Are secrets/tokens handled safely?
- Are TODO items marked done only if implemented and verified?
- Does `.clinerules/manifest.json` include new rule/workflow/hook references and `.agents/skills` references?

### Output
- Change summary
- Risks
- Required fixes
- Validation status
