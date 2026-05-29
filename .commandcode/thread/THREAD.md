# Project Thread — Persistent Context Log

> This file is the single source of truth for agent session continuity.
> Every AI agent MUST read this file before starting work and append to it after completing work.
> Subagents MUST receive relevant context from this file at dispatch time.

---

## How This File Works

1. **On session start**: Agent reads this file to recover full project context.
2. **During work**: Agent operates normally.
3. **On session end**: Agent appends a new entry with full details.
4. **Subagent dispatch**: Parent agent extracts relevant thread entries and passes them as context.

---

## Thread Format

Each entry MUST follow this structure:

```
### [YYYY-MM-DD HH:MM] — <session-title>

**Agent**: <agent-name-or-id>
**Prompt**: <exact user prompt or task description>

**Work Done**:
- <step-by-step summary of actions taken>
- <files read, modified, created, deleted>
- <commands executed>
- <decisions made and reasoning>

**Result**: <outcome — success, partial, failed, blocked>

**Key Findings**:
- <important discoveries, architectural decisions, blockers>
- <new dependencies, changed assumptions>

**Affected Files**:
- <list of files touched>

**Next Steps** (if applicable):
- <what should happen next>
- <known issues or follow-ups>

**Subagent Context** (if applicable):
- <what context was passed to subagents>
- <subagent results>
```

---

## Thread Entries

<!-- New entries are appended below this line -->

