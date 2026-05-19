---
name: browser-scratchpad
description: Embedded Browser Runtime ve Scratchpad Runtime tasarımı, güvenlik sınırı ve context entegrasyonu için kullanılır.
---

# Embedded Browser and Scratchpad

## Browser Runtime Requirements

- Browser Panel UI
- Preview Session Manager
- Navigation Controller
- Dev Server Connector
- Console Log Collector
- Network Event Collector
- Screenshot/DOM summary adapter
- Browser Security Boundary
- Agent browser tool adapter

## Scratchpad Runtime Requirements

- Scratchpad Editor
- Temporary File System
- Runtime Template Registry
- Execution Adapter
- Result Panel
- Isolation Guard
- Agent scratchpad tool adapter

## Safety Rules

1. Browser introspection açık izin gerektirir.
2. Scratchpad gerçek workspace’e varsayılan olarak yazmamalıdır.
3. Scratchpad export/apply işlemleri kullanıcı onayına bağlıdır.
