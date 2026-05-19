---
name: browser-scratchpad
description: Use for Embedded Browser Runtime and Scratchpad Runtime design, security boundaries, and context integration.
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

1. Browser introspection requires explicit permission.
2. Scratchpad must not write to the real workspace by default.
3. Scratchpad export/apply to workspace requires user approval.
