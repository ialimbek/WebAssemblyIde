# 09 — Token Optimization Rules

## Purpose

Minimize token consumption across all conversations. These rules apply to every tool call, file read, response, and interaction.

## File Reading Optimization

### Read Only What You Need

- **Use `start_line` and `end_line` parameters** in `read_file` when you only need a specific section of a large file. Do NOT read entire files when only a few lines are relevant.
- **Use `list_code_definition_names`** to get an overview of a file's structure before reading it fully. This avoids reading entire files just to understand their contents.
- **Use `search_files`** with targeted regex to find specific code patterns instead of reading whole files.
- **Avoid reading files you've already read** in the same conversation. Refer to the content already in context.

### Batch Reading with Subagents

- When multiple files must be read, **always use `use_subagents`** to read up to 5 files in parallel.
- Each subagent prompt should be specific: state exactly what to extract from the file, not "read and summarize everything."
- Subagent prompts should specify: file path, what to look for, and what to return (e.g., "Return only the function signatures and their line numbers").

### Avoid Unnecessary Reads

- **Do not read files speculatively.** Only read a file if you have a clear reason to.
- If you can answer a question from context already available, do NOT read additional files.
- If the user asks about a specific function or section, use `search_files` or `read_file` with line ranges, not full file reads.

## Response Optimization

### Concise Responses

- **Be direct and concise.** Avoid unnecessary explanations, preamble, or filler.
- Do NOT repeat information the user already knows or that is already in context.
- Use bullet points and tables instead of long paragraphs when presenting multiple items.
- Avoid conversational openings like "Great", "Certainly", "Sure", "Okay".

### Avoid Redundant Output

- Do not echo file contents back to the user unless specifically requested.
- Do not re-state the task or question in your response.
- Do not provide multiple versions of the same information.

## Tool Usage Optimization

### Minimize Tool Calls

- **Plan before acting.** Determine the minimum number of tool calls needed to complete a task.
- If one tool call can accomplish what would otherwise take multiple calls, use the single call.
- **Do not verify unnecessarily.** If a tool call succeeds and you have no reason to doubt it, do not run follow-up verification calls unless the task requires it.

### Prefer Efficient Tools

| Task                      | Preferred Tool                           | Avoid                             |
| ------------------------- | ---------------------------------------- | --------------------------------- |
| Find specific code        | `search_files`                           | Reading entire files              |
| Understand file structure | `list_code_definition_names`             | Reading entire files              |
| Read specific section     | `read_file` with `start_line`/`end_line` | Reading entire file               |
| Read multiple files       | `use_subagents`                          | Sequential `read_file` calls      |
| Make targeted edits       | `replace_in_file`                        | `write_to_file` for full rewrites |
| Create new files          | `write_to_file`                          | N/A                               |

### Subagent Prompt Efficiency

When creating subagent prompts:

- Be specific about what to extract
- Request only the information needed
- Do not ask subagents to "explain" or "analyze" unless analysis is the task
- Use format like: "Read [file], extract [specific items], return as [format]"

## Context Window Management

### Monitor Context Usage

- Be aware of the context window usage shown in environment_details.
- If context usage is high (>50%), be extra conservative with file reads and response length.
- Prefer targeted reads over full file reads when context is constrained.

### Avoid Context Pollution

- Do not include large code blocks in responses unless the user specifically asks.
- Do not read files that are not directly relevant to the current task.
- When editing files, use `replace_in_file` with minimal SEARCH blocks rather than rewriting entire files with `write_to_file`.

## Model-Specific Considerations

### High-Token Models (mimo-v2.5-pro, deepseek4-pro, chatgpt5.5-pro)

These models are powerful but expensive per token. Apply these rules strictly:

- **Always use the most targeted approach** for file reading
- **Prefer shorter, focused prompts** in subagents
- **Avoid exploratory reads** — plan your reads before executing
- **Use `search_files` liberally** to narrow down what you need before reading
- **Batch operations** to minimize the number of conversation turns

## Summary

Every tool call costs tokens. The goal is to accomplish the task with the minimum number of tool calls and the minimum amount of text read and generated. This is not about being lazy — it is about being efficient.
