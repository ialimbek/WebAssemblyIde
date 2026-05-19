# Skill: Project Terminal Runtime

## Use When

- Designing terminal runtime, PTY bridge, task runner, or agent command execution.

## Terminal Types

- User Terminal
- Agent Terminal
- Task Terminal
- Scratchpad Terminal

## Required Components

- Terminal Session Manager
- Shell Profile Resolver
- PTY Bridge
- Command Policy Guard
- Working Directory Guard
- Output Stream Parser
- Task Runner integration
- Context Engine ingestion
- Audit Log integration

## Safety

- Commands from Agent Runtime must go through Tool Registry.
- Risky commands require policy checks or explicit approval.
- Terminal output should be summarized for context, not blindly injected into prompts.
