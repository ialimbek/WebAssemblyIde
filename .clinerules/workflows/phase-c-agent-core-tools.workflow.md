# Workflow: Phase C — Agent Core and Safe Tools

## Goal

Create Agent Runtime skeleton, Tool Registry, approval workflow, risk model, and audit model.

## Steps

1. Define Agent session/state machine.
2. Add Chat Mode and Plan Mode skeletons.
3. Add Limited Act Mode boundaries.
4. Define Tool Registry manifest schema.
5. Design core tools: `read_file`, `search_files`, `apply_patch`, `run_command`.
6. Add permission/risk metadata.
7. Add approval workflow model.
8. Add audit log schema and safe summaries.
9. Validate tool boundaries.

## Success Criteria

- Agent orchestrates through tools only.
- Tools declare permissions and risk.
- Auditable action model exists.
