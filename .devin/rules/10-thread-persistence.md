---
trigger: always_on
---
# 10 — Thread Persistence and Context Continuity

## Purpose

Every AI agent session in this project MUST persist its context to a shared thread file.
This ensures continuity across sessions, enables subagent context distribution, and prevents
loss of work context when sessions restart or agents change.

## Thread File Location

- Path: `.commandcode/thread/THREAD.md`
- Format: Markdown with structured entries (see template in file)

## Mandatory Behaviors

### 1. Session Start — Read Thread

Before performing ANY work, the agent MUST:

1. Read `.commandcode/thread/THREAD.md`
2. Parse the most recent entries to recover project context
3. Use this context to inform all subsequent actions
4. If the thread is empty or missing, initialize it and proceed

### 2. During Session — Track Work

While working, the agent MUST track:

- All prompts received
- All files read, modified, created, or deleted
- All commands executed
- All decisions made and their reasoning
- Any blockers or issues encountered

### 3. Session End — Write Thread

After completing work (or when a session ends), the agent MUST:

1. Create a new thread entry following the format in `THREAD.md`
2. Include ALL required fields: Agent, Prompt, Work Done, Result, Key Findings, Affected Files
3. Include Next Steps if work is incomplete
4. Append the entry to `.commandcode/thread/THREAD.md`

### 4. Subagent Dispatch — Distribute Context

When dispatching work to a subagent:

1. Extract relevant thread entries from `THREAD.md`
2. Pass them as context to the subagent along with the task
3. The subagent MUST read this context before starting work
4. The subagent MUST write its own thread entry upon completion
5. Parent agent MUST integrate subagent results into its own thread entry

## Subagent Rules

- ALL subagents MUST use this thread system regardless of their origin
- Whether a subagent is internal, external, project-specific, or generic — thread rules apply
- Subagent thread entries are appended in the same file with the parent agent noted
- Parent agents are responsible for context distribution, not subagents

## Enforcement

- Do NOT skip thread reading at session start
- Do NOT skip thread writing at session end
- Do NOT dispatch subagents without thread context
- Do NOT mark work complete without a thread entry
