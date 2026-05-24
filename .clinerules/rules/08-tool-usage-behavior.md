# 08 — Tool Usage Behavior

## Parallel File Reading Rule

When multiple files need to be read for analysis, context gathering, or exploration:

- **Prefer `use_subagents`** to read multiple files in parallel (up to 5 at once) instead of reading files one by one with sequential `read_file` calls.
- Use `read_file` only when:
  - A single file needs to be read
  - The next step depends on the content of the previous file
  - Subagents are not available or not applicable
- When exploring a codebase, planning a change, or gathering context across several files, **always consider batch reading with subagents first**.

## Subagent Usage Guideline

- `use_subagents` is a built-in system tool — no extra configuration, settings toggle, or rule is needed to enable it.
- Each subagent prompt should be self-contained: specify the file path, what to look for, and what to return.
- Use subagents for: parallel file reading, parallel code search, parallel directory exploration, multi-file context gathering.
- Do not use subagents for: single file reads, tasks that require sequential dependency between reads, or when the result of one read determines the next file to read.

## General Tool Efficiency

- When the task involves understanding or comparing multiple files, read them in batches rather than sequentially.
- Avoid unnecessary round-trips: if you know upfront which files are needed, read them together using subagents.
- This rule applies to every new conversation — it is a permanent project behavior, not session-specific.
