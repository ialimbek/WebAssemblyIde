# 11 — Version Update Rule

## Purpose

Ensure the Codembly version is bumped whenever new features,
bug fixes, or significant changes are added.

## Version Bump Triggers

The version MUST be incremented when:
- New user-facing features are added
- Bug fixes that affect behavior are implemented
- Significant UI/UX changes are made
- Breaking changes are introduced
- New panels, themes, or major integrations are added

## Version Format

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- MAJOR: Breaking changes, major architecture shifts
- MINOR: New features, new themes, new panels (default for feature additions)
- PATCH: Bug fixes, minor styling tweaks, documentation updates

## Files to Update

When bumping the version, ALL of the following must be updated:

1. `packages/shared/src/constants/app.ts` — APP_VERSION constant
2. `package.json` (root) — version field
3. `apps/web/package.json` — version field
4. `apps/desktop/package.json` — version field
5. `apps/desktop/src-tauri/tauri.conf.json` — version field
6. `apps/desktop/src-tauri/Cargo.toml` — version field
7. `.clinerules/manifest.json` — version field
8. `.devin/manifest.json` — version field

## Enforcement

- Do not merge feature PRs without a version bump
- Include version change in the commit message
- Document what changed in a CHANGELOG or commit description
