# Skill: Agent Tools and Context

Use for Agent Runtime, Tool Registry, Context Engine, and safe tool execution flows.

Agent Modes: Chat, Plan, Limited Act, Review, Architect.

Core Tools: `read_file`, `write_file`, `apply_patch`, `search_files`, `list_files`, `run_command`, `git_diff`, `run_tests`, `open_preview`, `reload_preview`, `collect_console_logs`, `collect_network_errors`, `capture_screenshot`, `scratchpad_execute`, `lsp_diagnostics`, `package_manager`.

Context Sources: workspace scanner, symbol index, dependency graph, git diff/status, terminal output, browser logs/screenshots, scratchpad results, diagnostics/errors, recent files.

Rule: Agent Runtime orchestrates; actual operations are executed through the Tool Registry and runtime modules.
