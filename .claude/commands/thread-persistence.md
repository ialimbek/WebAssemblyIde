# Thread Persistence — Context Continuity System

Use this command to understand and enforce the thread persistence system.

## What It Does

Every AI agent session saves its full context to `.commandcode/thread/THREAD.md`.
When a new session starts, it reads this file first to recover project context.
All subagents receive relevant thread context at dispatch time.

## Thread File

Location: `.commandcode/thread/THREAD.md`

## Agent Protocol

### On Session Start
1. Read `.commandcode/thread/THREAD.md`
2. Parse recent entries for project context
3. Use context to inform all work

### During Session
- Track all prompts, files touched, commands executed, decisions made

### On Session End
1. Append a structured entry to `THREAD.md` with:
   - Agent name, exact prompt, step-by-step work summary
   - Files read/modified/created/deleted
   - Commands executed, decisions and reasoning
   - Result (success/partial/failed/blocked)
   - Key findings, affected files, next steps

### On Subagent Dispatch
1. Extract relevant thread entries
2. Pass as context to subagent
3. Subagent reads context, does work, writes own entry
4. Parent integrates subagent results

## Rules

- ALL subagents use this system regardless of origin
- Never skip thread read at start
- Never skip thread write at end
- Never dispatch subagents without thread context
- Never mark work complete without thread entry
