# 02 — Operating Protocol

## Task Start Checklist

For every architecture, coding, refactor, documentation, workflow, skill, or webhook task:

1. Read or use context from `ARCHITECTURE.md` and `TODO.md`.
2. State the goal, deliverables, success criteria, and constraints.
3. Break the task into small verifiable steps.
4. Reference relevant module/file paths and domain concepts.
5. Validate with file checks, tests, lint, build, or structural inspection where possible.

## Implementation Order

When bootstrapping the project, prioritize `TODO.md` → **Minimum Starting Order** (section: "İlk Başlanacak Minimum İş Sırası"):

1. Monorepo and base folders
2. Web and desktop app skeletons
3. Minimal app shell
4. Performance Core startup measurement
5. Panel Registry and lazy loading
6. Monaco Editor panel
7. Workspace Manager and File System Abstraction
8. Tauri desktop workspace open flow
9. Project Terminal Runtime
10. Agent Runtime and Tool Registry
11. Core tools: `read_file`, `search_files`, `apply_patch`, `run_command`
12. Embedded Browser POC
13. Scratchpad POC
14. Context Engine ingestion
15. BYOK AI provider connector POC
16. MVP demo flow

## Approval Rules

Do not perform destructive operations, global installs, network operations, credential access, or risky shell execution without explicit user approval.
