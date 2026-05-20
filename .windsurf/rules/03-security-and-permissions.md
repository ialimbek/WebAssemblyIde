# 03 — Security and Permissions

## AI Provider Rules

- Primary provider model is official API, BYOK, OAuth, or enterprise-managed provider configuration.
- Do not design the main product around web session scraping for ChatGPT, Claude, or similar products.
- Subscription/session bridges may only be experimental, local, user-controlled connectors with documented ToS risk.
- Never write or log API keys, tokens, secrets, credentials, refresh tokens, or session cookies in plain text.

## Permission Levels

- **Observe:** read/list/search only.
- **Suggest:** generate plans and diffs without applying changes.
- **Edit:** apply workspace changes under policy or explicit approval.
- **Execute:** run terminal/build/test commands under policy or explicit approval.
- **Autonomous:** limited automated execution inside explicit user-configured policy.

## Risk Classification

- **Low:** file reads, listing, search, diff generation.
- **Medium:** source edits, tests, lint, build, local dependency installation.
- **High:** secret access, destructive shell commands, network upload, `git push`, production config changes, browser/session automation.

## Audit Log Requirement

Agent/tool actions should capture:

- timestamp
- tool name
- permission/risk level
- input and output summary
- file changes
- user approval state
- resulting diff or command status
- errors and policy violations
