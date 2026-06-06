#!/usr/bin/env python3
"""
Post-cascade-response hook for Windsurf Cascade.
Updates TODO.md and handles agent-journal logging.
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime

def load_json_stdin():
    """Load JSON context from stdin."""
    try:
        data = json.load(sys.stdin)
        return data
    except Exception as e:
        print(f"Error reading stdin: {e}", file=sys.stderr)
        return {}

def ensure_agent_journals_structure(workspace_root):
    """Ensure .agent-journals directory structure exists."""
    journals_dir = workspace_root / ".agent-journals"
    
    subdirs = [
        journals_dir / "plans" / "pending",
        journals_dir / "plans" / "in-progress",
        journals_dir / "plans" / "completed",
        journals_dir / "plans" / "cancelled",
        journals_dir / "logs",
        journals_dir / "researches",
        journals_dir / "prompts",
        journals_dir / "knowledges",
        journals_dir / "summaries"
    ]
    
    for subdir in subdirs:
        subdir.mkdir(parents=True, exist_ok=True)
    
    return journals_dir

def log_prompt_exchange(workspace_root, user_prompt, ai_response, context_info):
    """Log prompt exchange to agent-journal."""
    journals_dir = ensure_agent_journals_structure(workspace_root)
    
    # Check if auto-logging is disabled
    disable_file = workspace_root / ".agent-journals" / ".disable-auto-logging"
    if disable_file.exists():
        print("⚠️  Auto-logging disabled")
        return
    
    now = datetime.now()
    date_dir = journals_dir / "prompts" / now.strftime("%Y-%m-%d")
    date_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename from first 8 words of prompt
    slug = "-".join(user_prompt.split()[:8]).lower()
    slug = "".join(c if c.isalnum() or c == "-" else "" for c in slug)
    timestamp = now.strftime("%H-%M-%S")
    filename = f"{timestamp}-auto-{slug}.md"
    
    log_file = date_dir / filename
    
    # Generate tags based on content
    tags = []
    prompt_lower = user_prompt.lower()
    if "bug" in prompt_lower or "fix" in prompt_lower:
        tags.append("#bugfix")
    if "feature" in prompt_lower or "add" in prompt_lower:
        tags.append("#feature")
    if "refactor" in prompt_lower:
        tags.append("#refactor")
    if "test" in prompt_lower:
        tags.append("#testing")
    if not tags:
        tags.append("#general")
    
    content = f"""---
timestamp: "{now.strftime('%Y-%m-%d %H:%M:%S')}"
type: auto_prompt
---

# Prompt: {slug[:50]}

**Time:** {now.strftime('%Y-%m-%d %H:%M:%S')}

## User Prompt

{user_prompt}

## AI Response

{ai_response[:2000]}...

## Context

{context_info}

## Tags

{' '.join(tags)}
"""
    
    try:
        log_file.write_text(content, encoding='utf-8')
        print(f"📝 Logged prompt exchange to {log_file.relative_to(workspace_root)}")
    except Exception as e:
        print(f"⚠️  Failed to log prompt: {e}", file=sys.stderr)

def log_file_changes(workspace_root, files_modified, reason):
    """Log file changes to agent-journal."""
    journals_dir = ensure_agent_journals_structure(workspace_root)
    
    disable_file = workspace_root / ".agent-journals" / ".disable-auto-logging"
    if disable_file.exists():
        return
    
    if not files_modified:
        return
    
    now = datetime.now()
    date_dir = journals_dir / "logs" / now.strftime("%Y-%m-%d")
    date_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = now.strftime("%H-%M-%S")
    filename = f"{timestamp}-auto-file-changes.md"
    log_file = date_dir / filename
    
    files_list = "\n".join(f"- `{f}`" for f in files_modified)
    
    content = f"""---
timestamp: "{now.strftime('%Y-%m-%d %H:%M:%S')}"
type: auto_change_log
---

# Change: File Modifications

**Time:** {now.strftime('%Y-%m-%d %H:%M:%S')}

## Files Modified

{files_list}

## Reason

{reason}

## Impact

Updated workspace files based on AI response.

## Notes

Logged automatically by post_cascade_response hook.
"""
    
    try:
        log_file.write_text(content, encoding='utf-8')
        print(f"📝 Logged file changes to {log_file.relative_to(workspace_root)}")
    except Exception as e:
        print(f"⚠️  Failed to log changes: {e}", file=sys.stderr)

def suggest_todo_updates(workspace_root, response_content):
    """Suggest TODO.md updates based on response."""
    todo_path = workspace_root / "TODO.md"
    if not todo_path.exists():
        print("⚠️  TODO.md not found")
        return
    
    # Simple keyword detection for TODO suggestions
    response_lower = response_content.lower()
    
    suggestions = []
    if "completed" in response_lower or "done" in response_lower:
        suggestions.append("Consider marking related TODO items as completed")
    if "created" in response_lower or "added" in response_lower:
        suggestions.append("Consider adding new TODO items for created features")
    if "fixed" in response_lower or "resolved" in response_lower:
        suggestions.append("Consider updating TODO status for fixed issues")
    
    if suggestions:
        print("📋 TODO.md update suggestions:")
        for suggestion in suggestions:
            print(f"  • {suggestion}")

def main():
    workspace_root = Path.cwd()
    
    # Load context from stdin
    context = load_json_stdin()
    user_prompt = context.get("user_prompt", "")
    ai_response = context.get("response", "")
    files_modified = context.get("files_modified", [])
    
    print(f"📊 Post-response processing for: {workspace_root}")
    print("-" * 50)
    
    # Ensure agent-journal structure
    ensure_agent_journals_structure(workspace_root)
    
    # Log prompt exchange
    if user_prompt and ai_response:
        context_info = f"Files modified: {len(files_modified) if files_modified else 0}"
        log_prompt_exchange(workspace_root, user_prompt, ai_response, context_info)
    
    # Log file changes
    if files_modified:
        log_file_changes(workspace_root, files_modified, "AI response applied")
    
    # Suggest TODO updates
    if ai_response:
        suggest_todo_updates(workspace_root, ai_response)
    
    print("-" * 50)
    print("✓ Post-response processing complete")
    
    sys.exit(0)

if __name__ == "__main__":
    main()
