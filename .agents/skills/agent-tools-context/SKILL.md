---
name: agent-tools-context
description: Use for Agent Runtime, Tool Registry, Context Engine, and safe tool execution flows.
---

# Agent Tools and Context

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

- Workspace scanner
- Symbol index
- Dependency graph
- Git diff/status
- Terminal output
- Browser logs/screenshots
- Scratchpad results
- Diagnostics/errors
- Recent files
- Error/diagnostic context

## Rule

Agent Runtime orchestrates; actual operations are executed through the Tool Registry and runtime modules.
