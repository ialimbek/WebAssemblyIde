# Skill: Agent Tools and Context

## Use When

- Building Agent Runtime.
- Creating Tool Registry tools.
- Designing Context Engine ingestion and ranking.

## Agent Modes

- Chat Mode
- Plan Mode
- Limited Act Mode
- Review Mode
- Architect Mode

## Core Tools

- `read_file`
- `write_file`
- `apply_patch`
- `search_files`
- `list_files`
- `run_command`
- `git_diff`
- `run_tests`
- `open_preview`
- `reload_preview`
- `collect_console_logs`
- `collect_network_errors`
- `capture_screenshot`
- `scratchpad_execute`
- `lsp_diagnostics`
- `package_manager`

## Context Sources

- workspace scanner
- symbol index
- dependency graph
- recent files
- git diff/status
- terminal output
- browser logs/screenshots
- scratchpad results
- diagnostics/errors

## Rule

Agent Runtime should orchestrate; Tool Registry and runtime modules should execute.
