# 05 — Docs and TODO Sync

## Source of Truth

- `ARCHITECTURE.md`: architecture and product direction.
- `TODO.md`: implementation order and task inventory.
- `.clinerules`: root Cline behavior.
- `.cline/manifest.json`: registered Cline resources.

## TODO Discipline

- Do not mark TODO items done for planning-only changes.
- Mark TODO items done only when implemented and verified.
- If architecture changes, update `ARCHITECTURE.md`.
- If implementation order changes, update `TODO.md`.
- If `.cline` resources change, update `.cline/manifest.json`.

## Required Documentation Areas

Maintain or create focused docs as the project grows:

- architecture
- security
- agent runtime
- terminal runtime
- browser runtime
- scratchpad runtime
- context engine
- provider integrations
- performance
- subscription/session risk
- MVP demo workflows
- accessibility
- i18n
- settings
- error handling
