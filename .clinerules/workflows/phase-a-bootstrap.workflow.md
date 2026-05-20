# Workflow: Phase A — Bootstrap and Fast Startup

## Goal

Create the initial monorepo skeleton, minimal shell, and startup/performance foundation.

## Steps

1. Verify `ARCHITECTURE.md` and `TODO.md` context.
2. Create monorepo base folders and package/crate/service boundaries (see TODO.md 2.1).
3. Establish TypeScript/Rust standards and local dependency strategy.
4. Create web and desktop skeletons.
5. Build minimal app shell (see TODO.md 2.3).
6. Add `performance-core` startup measurement interfaces (see TODO.md 2.2).
7. Add Panel Registry and lazy loading conventions (see TODO.md 2.2, 2.3).
8. Add Command Bus and Event Bus interfaces (see TODO.md 2.4).
9. Validate structure and update docs if needed.

## Success Criteria

- Folder structure matches architecture (apps/, packages/, crates/, services/).
- Minimal shell can be reasoned about or run.
- Startup path excludes heavy services.
- Panel Registry and lazy loading infrastructure in place.
- Command Bus and Event Bus interfaces defined.
- TODO items are only checked after verification.
