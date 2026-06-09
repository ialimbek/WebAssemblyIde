---
auto_execution_mode: 2
---
# Workflow: Review and Sync

## Goal

Review implementation changes for architecture alignment, security, performance, accessibility, i18n, and documentation/TODO consistency.

## Steps

1. Inspect changed files and affected modules.
2. Compare against `.clinerules`, `.devin/rules/*`, `ARCHITECTURE.md`, and `TODO.md`.
3. Check Command Bus/Event Bus/Tool Registry boundaries.
4. Check permissions, risk levels, audit behavior, and secret handling.
5. Check lazy loading, worker-first execution, and cache implications.
6. Check accessibility (WCAG 2.1 AA) compliance for new UI components.
7. Check i18n support for new user-facing strings.
8. Check settings, error handling, and update strategy implications.
9. Confirm TODO items are not prematurely marked complete.
10. Confirm `.devin/manifest.json` includes any added Devin resources.
11. Run available validation commands or structural checks.

## Output

- Review summary
- Violations or risks
- Required fixes
- Validation results
