# Skill: AI Gateway and Security

## Use When

- Designing AI provider connectors.
- Implementing BYOK/OAuth/token vault flows.
- Adding Model Router behavior.

## Provider Priority

1. Official API / BYOK
2. Official OAuth providers
3. Enterprise-managed providers
4. Local user connector as experimental only

## Model Router Criteria

- context window
- tool calling support
- cost
- latency
- privacy level
- coding capability
- user preference
- task risk level

## Security Rules

- Never log or persist secrets in plain text.
- Use OS keychain on desktop.
- Use backend vault/KMS for web/cloud.
- Normalize provider errors without leaking tokens.
- Audit token access and provider calls with safe summaries.
