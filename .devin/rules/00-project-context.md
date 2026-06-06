# 00 — Project Context Rule

## Purpose

All Windsurf work in this repository must align with the project vision documented in:

- `ARCHITECTURE.md`
- `TODO.md`
- `.clinerules`
- `.windsurf/manifest.json`

## Non-Negotiable Architecture Context

This project is a next-generation, AI-native IDE built around:

- Monaco Editor
- Tauri v2 desktop shell
- Rust/Wasm services
- Custom Agent Runtime
- AI Provider Gateway
- Project Terminal Runtime
- Embedded Browser Runtime
- Scratchpad Runtime
- Command Bus and Event Bus based loose coupling

## Required Behavior

Before architectural, coding, refactor, planning, workflow, or documentation tasks:

1. Treat `ARCHITECTURE.md` as the source of architectural truth.
2. Treat `TODO.md` as the source of implementation order.
3. Prioritize `TODO.md` → `Minimum Starting Order` for bootstrap work.
4. Do not propose a VS Code/Codium fork as the core strategy.
5. Reuse VS Code/Codium ideas only for compatibility layers such as themes, keybindings, snippets, grammars, and later extension subsets.

## Expected Output Style

Every implementation plan should clearly state:

- Goal
- Deliverables
- Success criteria
- Constraints
- Affected modules/files
- Validation approach
