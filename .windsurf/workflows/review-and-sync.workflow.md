# Workflow: Review and Sync

## Goal

Review implementation changes for architecture alignment, security, performance, and documentation/TODO consistency.

## Steps

1. Inspect changed files and affected modules.
2. Compare against `.clinerules`, `.windsurf/rules/*`, `ARCHITECTURE.md`, and `TODO.md`.
3. Check Command Bus/Event Bus/Tool Registry boundaries.
4. Check permissions, risk levels, audit behavior, and secret handling.
5. Check lazy loading, worker-first execution, and cache implications.
6. Confirm TODO items are not prematurely marked complete.
7. Confirm `.windsurf/manifest.json` includes any added Windsurf resources.
8. Run available validation commands or structural checks.

## Output

- Review summary
- Violations or risks
- Required fixes
- Validation results
