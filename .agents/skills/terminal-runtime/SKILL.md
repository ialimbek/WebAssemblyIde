---
name: terminal-runtime
description: Use for Project Terminal Runtime design including PTY bridge, command policy, output parser, and agent-safe command execution.
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

- Agent commands must go through the Tool Registry.
- Risky commands must be blocked by policy or require explicit user approval.
- Terminal output must not be injected raw into prompts; it should be safely summarized.
