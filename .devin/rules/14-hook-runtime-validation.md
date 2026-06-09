---
trigger: always_on
---
# 14 - Devin Hook Runtime Validation Rule

## Purpose

Ensure Devin loads and honors `.devin/hooks.json` on every prompt-driven session, and that hook execution can be verified with a small heartbeat log.

## Required Behavior

- Treat `.devin/hooks.json` as the Devin hook runtime source of truth for prompt and code-write events.
- Before handling a new prompt, verify the active hook script paths exist on disk.
- Use `pre_user_prompt`, `post_cascade_response`, and `post_write_code` as the active Devin event hooks.
- Treat `project-analysis.ps1` as an internal helper invoked from `pre_user_prompt.ps1`, not as a standalone runtime hook.
- Emit a short activation log to `.agent-journals/logs/` or stdout whenever a Devin hook fires.
- If the hook wiring changes, update `.devin/manifest.json` so the catalog stays in sync.

## Scope

- This rule applies to Devin only.
- Do not modify `.clinerules` resources from this rule.
