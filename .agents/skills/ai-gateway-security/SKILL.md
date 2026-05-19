---
name: ai-gateway-security
description: BYOK/OAuth/enterprise provider modeli, token vault, Model Router ve AI güvenlik sınırları için kullanılır.
---

# AI Gateway and Security

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

- Secret/token/API key değerlerini düz metin yazma veya loglama.
- Desktop için OS keychain, web/cloud için backend vault/KMS kullan.
- Provider hatalarını token sızdırmadan normalize et.
- Token erişimi ve provider çağrılarını güvenli özetlerle audit et.
