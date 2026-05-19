---
name: terminal-runtime
description: Project Terminal Runtime, PTY bridge, command policy, output parser ve agent-safe komut çalıştırma tasarımı için kullanılır.
---

# Project Terminal Runtime

## Terminal Types

- User Terminal
- Agent Terminal
- Task Terminal
- Scratchpad Terminal

## Required Components

1. Terminal Session Manager
2. Shell Profile Resolver
3. PTY Bridge
4. Command Policy Guard
5. Working Directory Guard
6. Output Stream Parser
7. Task Runner integration
8. Context Engine ingestion
9. Audit Log integration

## Safety Rules

- Agent komutları Tool Registry üzerinden yürümelidir.
- Riskli komutlar policy veya açık kullanıcı onayına takılmalıdır.
- Terminal çıktısı prompt’a ham aktarılmamalı, güvenli özetlenmelidir.
