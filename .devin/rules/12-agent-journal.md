---
trigger: always_on
---
# 12 — Agent Journal Rule

## Purpose

This rule defines the `/agent-journal` skill for persistent workspace tracking. Automatically logs prompt exchanges and file changes in the background, creates and manages plans, conducts structured research, generates time-based summaries, and integrates with the `/graphify` knowledge graph.

## Skill Definition

**Name:** agent-journal
**Description:** AI agent workspace tracker with automatic logging of plans, changes, prompt exchanges, research, and time-based summaries. Auto-triggers on planning, tracking, research, knowledge work, summarization requests, and whenever the user wants to save or organize findings. Also auto-logs all exchanges and file changes silently in the background while active.
**Argument Hint:** [command] [options]
**Allowed Tools:** read, edit, grep, glob, exec, skill
**Permissions:**
- Read(.agent-journals/**)
- Write(.agent-journals/**)
- Exec(git)
**Triggers:** user, model

## Workspace Directory

All data lives in `.agent-journals/` at the project root:

```
.agent-journals/
├── plans/
│   ├── pending/
│   ├── in-progress/
│   ├── completed/
│   └── cancelled/
├── logs/
│   └── yyyy-mm-dd/
│       └── hh-mm-ss-auto-[operation].md
├── researches/
│   └── yyyy-mm-dd-hhmmss-[name]/
│       ├── sources/
│       └── index.md
├── prompts/
│   └── yyyy-mm-dd/
│       └── hh-mm-ss-auto-[topic].md
├── knowledges/
│   └── (populated by /graphify)
└── summaries/
    └── yyyy-mm-[summary].md
```

**On every invocation:** Ensure `.agent-journals/` and all subdirectories exist. Create any missing folders silently.

## Automatic Logging (Background Behavior)

When this skill is active, it continuously logs in the background WITHOUT explicit commands or announcements.

### Auto-Prompt Logging

After every user message and the corresponding AI response:
1. Write `.agent-journals/prompts/yyyy-mm-dd/hh-mm-ss-auto-[slug].md`
2. Use the Prompt template with `type: auto_prompt`
3. Fill `User Prompt` with the user's exact message
4. Fill `AI Response` with the substantive response (not tool-call noise)
5. Fill `Context` with any active plan, research, or modified files relevant to the exchange
6. Add 2-4 tags based on the topic
7. **Run silently.** Do not announce.

**Skip:** skill invocations, pure tool-call results.

### Auto-Change Logging

After every file modification (write, edit, delete) during this skill session:
1. Write `.agent-journals/logs/yyyy-mm-dd/hh-mm-ss-auto-[slug].md`
2. Use the Log template with `type: auto_change_log`
3. Fill `Files Modified` with the exact paths changed
4. Fill `Reason` with the purpose of the change
5. Fill `Impact` with what this affects
6. **Run silently.** Do not announce.

**Skip:** `.agent-journals/` files, read-only ops, or if `.disable-auto-logging` exists.

### Disabling Auto-Logging

If the user says *"disable auto logging"*, *"stop logging"*, or *"turn off auto log"*:
1. Create `.agent-journals/.disable-auto-logging`
2. Announce: `"Auto-logging disabled. Create plans, researches, and summaries still work. Re-enable with /agent-journal enable logging."`

If the user says *"enable auto logging"*, *"start logging"*, or *"turn on auto log"`:
1. Remove `.agent-journals/.disable-auto-logging` if it exists
2. Announce: `"Auto-logging enabled. Prompts and changes will be logged silently."`

## Command Parsing

The skill accepts arguments via `$ARGUMENTS` (all text after `/agent-journal`).

Parse the first token as the **command**, the rest as **arguments**:

| Command | Arguments | Action |
|---------|-----------|--------|
| `plan` | `[plan-name]` | Create a new plan in `pending/` |
| `continue` | — | Smart resume of active or pending plans |
| `research` | `[researches-name]` | Start a research topic |
| `status` | — | Show workspace summary |
| `summary` | `monthly [month] [custom-prompt]` or `yearly [year] [custom-prompt]` | Generate a time-based summary |
| `knowledge` | `[path]` | Run `/graphify` on workspace or path |

If no command is given (bare `/agent-journal`), run `status`.

If the command is unrecognized, respond with: `"Unknown command: [command]. Available: plan, continue, research, status, summary, knowledge."`

## Plan Management

### Creating a Plan

When `plan [plan-name]` is invoked:

1. **Slugify the plan name**: lowercase, replace spaces with hyphens, remove special characters. Keep it under 60 chars.
2. **Generate timestamp**: `yyyy-mm-dd-hhmmss` based on the current UTC or local time.
3. **File path**: `.agent-journals/plans/pending/yyyy-mm-dd-hhmmss-[slugified-name].md`
4. **Write the plan file** using this exact template:

```markdown
---
title: "[Original human-readable plan name]"
created_at: "yyyy-mm-dd hh:mm:ss"
status: pending
current_stage: 0
total_stages: 0
---

# [title]

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---

## Stages

<!-- Add stages as they are defined -->

## Changelog

<!-- Log any plan revisions here with timestamps -->

```

5. **Announce**: `Created plan: [filename] in plans/pending/`

### Moving Plan Status

When a plan starts execution, move it from `pending/` to `in-progress/`.
When completed, move it to `completed/`.
When cancelled, move it to `cancelled/`.

**Move safely**: Read the file, write it to the destination, then remove the source. Never lose a plan file.

Update the frontmatter `status` field to match the new folder.

### Plan Revisions

When a plan changes during execution:

1. Append to the `## Changelog` section:

```markdown
### yyyy-mm-dd hh:mm:ss

**Change:** [Brief description]

**Reason:** [Why the change was needed]

**Impact:** [What stages/files are affected]
```

2. **Do NOT rename the file**. The original creation timestamp must remain unchanged.
3. Update `current_stage` and `total_stages` in frontmatter if applicable.

## Continue Logic

When `continue` is invoked, follow this exact decision tree:

1. **Scan `plans/in-progress/`**
   - If **1 file**: Read it. Announce `"Resuming plan: [filename]"`. Present the plan summary and ask `"Which stage should we work on?"` or proceed if the next stage is obvious.
   - If **2+ files**: List them with index numbers. Ask the user: `"Multiple plans are in progress. Which one should we continue?"`. Wait for selection.
   - If **0 files**: Proceed to step 2.

2. **Scan `plans/pending/`** (only if in-progress is empty)
   - If **1 file**: Announce `"No in-progress plans found. Starting pending plan: [filename]"`. Move it to `in-progress/` and begin.
   - If **2+ files**: List them. Ask `"No in-progress plans. Which pending plan should we start?"`. Wait for selection.
   - If **0 files**: Announce `"No active or pending plans found. Create one with /agent-journal plan [name]"`. Stop.

**Never** automatically pick a plan when multiple exist. Always ask the user.

## Prompt & Log Templates

These templates are used by the Automatic Logging system. They are NOT invoked by manual commands.

### Prompt Template

```markdown
---
timestamp: "yyyy-mm-dd hh:mm:ss"
type: auto_prompt
---

# Prompt: [topic-or-first-8-words]

**Time:** yyyy-mm-dd hh:mm:ss

## User Prompt

[The exact user message]

## AI Response

[The substantive AI response]

## Context

[Any relevant context: related plan, research, files touched]

## Tags

[#tag1, #tag2, #tag3]
```

### Log Template

```markdown
---
timestamp: "yyyy-mm-dd hh:mm:ss"
type: auto_change_log
---

# Change: [operation-description]

**Time:** yyyy-mm-dd hh:mm:ss

## Files Modified

- `path/to/file1`
- `path/to/file2`

## Reason

[Purpose of the change]

## Impact

[What this affects]

## Notes

[Any additional context]
```

## Research Tracking

When `research [researches-name]` is invoked:

1. **Slugify** the research name.
2. **Generate timestamp**: `yyyy-mm-dd-hhmmss`
3. **Create directory**: `.agent-journals/researches/yyyy-mm-dd-hhmmss-[slugified-name]/`
4. **Create subdirectories**: `sources/`
5. **Write index.md** using this exact template:

```markdown
---
title: "[researches-name]"
created_at: "yyyy-mm-dd hh:mm:ss"
status: in-progress
---

# [title] - Research Index

## Objective

[What are we trying to find out?]

## Sources

<!-- List all gathered sources -->

## Key Findings

<!-- Summarize findings from sources -->

## Recommendations

<!-- Actionable recommendations based on findings -->

## Related

<!-- Links to plans, logs, or knowledges that relate to this research -->
```

6. **Announce**: `Created researches: [directory]/`

When research completes, update `status` to `completed` in the frontmatter.

## Knowledge & Graphify Integration

When `knowledge` is invoked:

1. **Check if `/graphify` skill exists** by attempting to read `~/.claude/skills/graphify/SKILL.md` or checking if the user has the graphify skill available.
2. **If available**: Invoke `/graphify` on `.agent-journals/` or the provided path. After it completes, ensure the outputs are accessible from `.agent-journals/knowledges/`.
3. **If NOT available** (fallback): Create or update `.agent-journals/knowledges/knowledges-index.md` with:
   - Links to all plans
   - Links to all research topics
   - Links to recent logs
   - Links to recent prompt exchanges
   - Links to generated summaries
   - A brief project architecture summary

4. **Announce**: `Knowledge updated in .agent-journals/knowledges/`

## Summary Generation

When `summary monthly [month] [custom-prompt]` or `summary yearly [year] [custom-prompt]` is invoked:

### Parsing Arguments

Parse the second token as **period** (`monthly` or `yearly`), the third token as optional **target** (month number/name or year), and everything after the target as optional **custom-prompt**.

| Example Command | Period | Target | Custom Prompt |
|-----------------|--------|--------|---------------|
| `summary monthly` | monthly | — | — |
| `summary monthly 6` | monthly | June | — |
| `summary monthly June` | monthly | June | — |
| `summary monthly 6 focus on auth` | monthly | June | `focus on auth` |
| `summary yearly` | yearly | — | — |
| `summary yearly 2026` | yearly | 2026 | — |

### Summary Content Rules

When generating summaries, do NOT just list titles. **Read every file completely** and extract:

- **Plans:** Read FULL file. Include: title, status, Goal, Architecture, Tech Stack, current stage, ALL changelog entries. Explain pivots: BEFORE → AFTER.
- **Logs:** Read FULL file. Include: exact files modified, reason, impact, notes. Synthesize multiple logs affecting the same feature.
- **Prompts:** Read FULL file. Include: core user question, AI's key decision, context, tags. Group by recurring topics.
- **Researches:** Read FULL file. Include: objective, key findings, recommendations, status.

**Evolution tracking:** If a feature or decision changed over time (e.g., a plan switched from JWT to session auth, then added Redis), the summary must capture the FINAL state and briefly trace the path that led there. Do not present outdated intermediate states as current.

### If Target is Specified

1. Determine the target month/year from the user's input.
   - For `monthly`: Accept month numbers (`1`-`12`) or English month names (`January`-`December`). Map names to numbers.
   - For `yearly`: Accept a 4-digit year (`2024`, `2025`, etc.).
2. Scan ALL files in `plans/`, `logs/`, `researches/`, `prompts/`, and `knowledges/`.
   - Extract creation dates from filenames (yyyy-mm-dd-hhmmss for plans, yyyy-mm-dd for logs/prompts, yyyy-mm-dd-hhmmss for researches).
   - Filter to only files/directories whose date falls within the target month or year.
3. **Read every matching file completely.** Do not skip any file.
4. **Build a timeline**: Order all entries chronologically by their creation date.
5. **Write the summary file**:
   - `monthly` → `.agent-journals/summaries/yyyy-mm-[slugified-custom-prompt-or-monthly-summary].md`
   - `yearly` → `.agent-journals/summaries/yyyy-[slugified-custom-prompt-or-yearly-summary].md`
6. Use this exact template:

```markdown
---
period: "monthly" # or "yearly"
target: "yyyy-mm" # or "yyyy"
generated_at: "yyyy-mm-dd hh:mm:ss"
custom_prompt: "[custom prompt if provided, else 'none']"
files_scanned: N
total_entries: N
---

# Summary: [Month/Year] - [custom prompt or "Workspace Overview"]

**Generated:** yyyy-mm-dd hh:mm:ss
**Files Scanned:** N
**Total Entries:** N

---

## Overview

[What was planned, researched, changed, key decisions, trajectory.]

## Plans

[Title, status, stage, Goal, Architecture, Tech Stack. Summarize Changelog evolution: BEFORE → AFTER.]

## Changes (Logs)

[Files modified, reason, impact. Group by feature. Show evolution across multiple logs.]

## Research

[Objective, key findings, recommendations, status.]

## Prompt Exchanges

[Core user question, AI's key decision, context, tags. Group by recurring topics.]

## Notable Patterns & Decisions

[Recurring topics, architectural pivots, strategic shifts, blockers.]

## Unreported Details

<!-- List any details that could NOT fit above. If nothing missing, write: "All entries incorporated." -->

## Next Steps / Open Items

[Pending plans, unresolved research, action items.]
```

7. **After writing**, read the summary back and verify:
   - Every scanned file is represented in at least one section.
   - No plan's outdated intermediate state is presented as current.
   - The `## Unreported Details` section exists and is honest.
8. **Announce**: `Generated summary: [filename] with N entries from [period].`

### If Target is NOT Specified

1. Scan ALL files across `plans/`, `logs/`, `researches/`, `prompts/`, and `knowledges/`.
2. Extract the unique months (for `monthly`) or years (for `yearly`) present in the data.
3. For **each** unique month/year, generate a separate summary file following the exact same rules.
4. **Announce** the list of generated files: `Generated X summaries: [file1], [file2], ...`

### Custom Prompt Handling

If a custom prompt is provided (text after the target), treat it as a **filtering lens**:
- Still scan ALL files.
- Weight entries related to the custom prompt more heavily in the narrative.
- The summary must still mention all files, but the Overview and Notable Patterns sections should center on the custom prompt's theme.
- Include the custom prompt in the frontmatter and the title.

## Status Summary

When `status` is invoked (or bare `/agent-journal`):

1. Count files in each `plans/` subdirectory.
2. Count log files from the most recent 7 days.
3. Count research directories.
4. Count prompt files from the most recent 7 days.
5. Count summary files in `summaries/`.
6. Check if `knowledges/` has content.
7. Check if `.agent-journals/.disable-auto-logging` exists.
8. Output a clean summary:

```
Agent Journal Status
====================
Plans:
  Pending:     N
  In Progress: N
  Completed:   N
  Cancelled:   N
Recent Logs (7d):     N entries
Research Topics:      N
Prompt Exchanges (7d): N
Summaries Generated:  N
Auto-Logging: [Enabled / Disabled]
Knowledge Graph: [Present / Missing]
```

## Important Rules

- **Never delete a plan file**. Only move between status folders.
- **Never rename plan files after creation**. The timestamp is immutable.
- **Always slugify names** for filenames, but preserve the original readable name inside the file.
- **Always create missing directories** silently. Do not fail if `.agent-journals/` doesn't exist yet.
- **Use copy-then-delete for moves** to prevent data loss.
- **Never truncate AI responses** in prompt files. Log the full substantive response.
- **Never skip files when generating summaries**. Every scanned file must be accounted for in at least one section or in `## Unreported Details`.
- **Reflect the FINAL state** of evolving plans/features in summaries, not outdated intermediate states.
- **Read every file fully** during summary generation. Do not skim or extract only titles.
- **Keep this rule file under 500 lines** — this rule is within limit.
- **When in doubt, ask the user.** Do not guess which plan to continue.
