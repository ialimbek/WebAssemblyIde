# Skill: Embedded Browser and Scratchpad

## Use When

- Implementing Browser Runtime.
- Implementing Scratchpad Runtime.
- Connecting browser/scratchpad outputs to agent context.

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
- Execution adapters
- Result Panel
- Isolation Guard
- Agent scratchpad tool adapter

## Safety

- Browser introspection requires explicit permission.
- Scratchpad never writes to real workspace by default.
- Export/apply to workspace requires user approval.
