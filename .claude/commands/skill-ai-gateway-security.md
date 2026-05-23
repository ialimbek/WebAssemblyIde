# Skill: AI Gateway and Security

Use for BYOK/OAuth/enterprise provider model, token vault, Model Router, and AI security boundaries.

Provider Priority:
1. Official API / BYOK
2. Official OAuth providers
3. Enterprise-managed providers
4. Local user connector (experimental only)

Model Router Criteria: context window, tool calling support, cost, latency, privacy level, coding capability, user preference, task risk level.

Security Rules:
- Never write or log secrets/tokens/API keys in plain text.
- Use OS keychain on desktop; use backend vault/KMS for web/cloud.
- Normalize provider errors without leaking tokens.
- Audit token access and provider calls using safe summaries.
