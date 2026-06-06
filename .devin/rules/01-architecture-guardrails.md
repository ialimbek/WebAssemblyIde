---
trigger: always_on
---
# 01 — Architecture Guardrails

## Core Rule

Keep the IDE modular, fast, secure, and agent-first. All implementation must follow the architecture defined in `ARCHITECTURE.md`.

## Required Layers

- **Application Layer:** Tauri desktop shell, web shell, Monaco UI, panels.
- **Experience Runtime Layer:** Layout Manager, Command Palette, Command Bus, Event Bus, Panel Registry, Theme/Keybinding Manager.
- **IDE Core Layer:** Workspace Manager, File System Abstraction, Git, Diagnostics, Terminal Runtime, Browser Runtime, Scratchpad Runtime.
- **Intelligence Layer:** Agent Runtime, Tool Registry, Context Engine, LSP Bridge, Wasm parser/indexer/diff services, Model Router.
- **Execution Layer:** Desktop Host Bridge, Browser Sandbox, WASI/WebContainer adapter, Remote Runner, native PTY/process manager.
- **Cloud Control Plane:** Auth, Token Vault, Provider Gateway, Team/Workspace Sync, Audit Logs, Policy/Rate Limit.

## Coupling Rules

- Modules must communicate through explicit interfaces, Command Bus, Event Bus, or Tool Registry.
- Agent Runtime must not directly mutate workspace files, terminal sessions, browser state, or scratchpad state.
- UI panels must not own core business logic.
- Runtime packages must be independently testable.
- Do not create hidden direct dependencies between terminal, browser, scratchpad, context engine, agent runtime, and AI gateway.

## VS Code/Codium Boundary

- Do not fork VS Code/Codium as the product core.
- Use compatibility ideas gradually: themes, keybindings, snippets, TextMate grammars, language configuration, Open VSX, and web extension API subset.
