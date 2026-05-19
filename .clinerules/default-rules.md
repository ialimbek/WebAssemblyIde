# Cline Project Rules — WebAssemblyIde

These are the Cline behavior rules for this repository. For every task, this file is treated as the primary instruction set.

## 1. Mandatory Project Context

- Before any architecture, coding, refactor, or file-generation work, use `ARCHITECTURE.md` and `TODO.md` as context.
- This project must follow the **Monaco + Tauri + Rust/Wasm services + custom Agent Runtime + AI Provider Gateway + Project Terminal + Embedded Browser + Scratchpad Runtime** architecture.
- Do not fork VS Code/Codium directly; only reuse compatibility ideas gradually (themes, keybindings, snippets, grammars, extension subset).
- For implementation order, follow `TODO.md` → **"Minimum Starting Order"** (section: "İlk Başlanacak Minimum İş Sırası") first.

## 2. Operating Protocol

- Before starting, define the goal, deliverables, success criteria, and constraints.
- Break large work into small, verifiable steps.
- After each meaningful step, validate via build/test/lint or file verification when possible.
- Do not perform destructive actions, install packages, install global tools, access credentials, or do network-based operations without user approval.
- When scaffolding or adding new skeletons, use local project dependencies (do not assume global tooling).

## 3. Architecture Guardrails

- Always consider performance, fast startup, lazy loading, worker-first execution, and caching strategies.
- UI shell, terminal, browser, scratchpad, agent runtime, context engine, and AI gateway must remain loosely coupled.
- Modules must not be tightly coupled; prefer `Command Bus`, `Event Bus`, and explicit interface contracts.
- Agent Runtime must not directly manipulate workspace files/terminal/browser/scratchpad; all actions go through the Tool Registry.
- Scratchpad must not write to the real workspace by default; export/apply requires explicit user approval.
- Embedded Browser introspection (console/network/DOM/screenshot) requires explicit permission and a security boundary.

## 4. Security and AI Provider Rules

- Primary AI access model must be official API/BYOK/OAuth.
- ChatGPT/Claude web session scraping must not be the main product strategy.
- Subscription/session bridges are experimental and must be treated as local user connectors with documented ToS risk.
- Never write or log secrets, tokens, API keys, or credentials in plain text.
- Agent actions must be auditable (tool name, input/output summaries, file changes, approval state, diff, error info).

## 5. TODO and Documentation Rules

- Mark `TODO.md` items as done only when they are implemented and verified.
- Do not auto-complete TODO items for planning-only changes.
- If architecture decisions change, update `ARCHITECTURE.md`. If implementation order changes, update `TODO.md`.
- If new Cline rule/skill/workflow/hook is added, update `.clinerules/manifest.json`.
- If backward compatibility is needed, `.cline/manifest.json` can be kept in sync, but in this project Cline UI resources are sourced from `.clinerules/`.

## 6. In-Repo Cline Resources

Detailed rules, skills, workflows, and hook templates are located at:

- `.clinerules/rules/`
- `.agents/skills/<skill-name>/SKILL.md`
- `.clinerules/workflows/`
- `.clinerules/hooks/`
- `.clinerules/manifest.json`

Note: the `.cline/` folder is not used. For visible Cline workflow/rule/hook integration, `.clinerules/` is the source of truth; for skills integration, `.agents/skills/` is the source of truth.

For each task, refer to the relevant workflow and skill definitions.
