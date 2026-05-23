# Phase C — Agent Core and Safe Tools

Goal: Create Agent Runtime skeleton, Tool Registry, approval workflow, risk model, and audit model.

Steps:
1. Define Agent session/state machine (see TODO.md 2.12).
2. Add Chat Mode and Plan Mode skeletons (see TODO.md 2.12).
3. Add Limited Act Mode boundaries (see TODO.md 2.12).
4. Define Tool Registry manifest schema (see TODO.md 2.13).
5. Design core tools: `read_file`, `search_files`, `apply_patch`, `run_command` (see TODO.md 2.13).
6. Add browser and scratchpad tools (see TODO.md 2.13).
7. Add permission/risk metadata (see TODO.md 2.13, 2.19).
8. Add approval workflow model (see TODO.md 2.19).
9. Add audit log schema and safe summaries (see TODO.md 2.19).
10. Validate tool boundaries.

Success Criteria:
- Agent orchestrates through tools only.
- Tools declare permissions and risk.
- Auditable action model exists.
- Browser and scratchpad tools defined.
