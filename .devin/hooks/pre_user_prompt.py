#!/usr/bin/env python3
"""
Pre-user-prompt hook for Windsurf Cascade.
Validates ARCHITECTURE.md compliance and matches workflows.
"""

import json
import sys
import os
from pathlib import Path

def load_json_stdin():
    """Load JSON context from stdin."""
    try:
        data = json.load(sys.stdin)
        return data
    except Exception as e:
        print(f"Error reading stdin: {e}", file=sys.stderr)
        return {}

def check_architecture_compliance(workspace_root):
    """Check if ARCHITECTURE.md exists and is readable."""
    arch_path = workspace_root / "ARCHITECTURE.md"
    if not arch_path.exists():
        print(f"⚠️  WARNING: ARCHITECTURE.md not found at {arch_path}", file=sys.stderr)
        return False
    print(f"✓ ARCHITECTURE.md found and accessible")
    return True

def match_workflow(workspace_root, user_prompt):
    """Match user prompt to appropriate workflow."""
    workflows_dir = workspace_root / ".windsurf" / "workflows"
    if not workflows_dir.exists():
        print("⚠️  Workflows directory not found")
        return None
    
    # Simple keyword matching for workflow suggestion
    prompt_lower = user_prompt.lower()
    
    workflow_keywords = {
        "phase-a-bootstrap": ["bootstrap", "skeleton", "setup", "initial"],
        "phase-b-editor-workspace-terminal": ["editor", "workspace", "terminal", "file"],
        "phase-c-agent-core-tools": ["agent", "tool", "runtime", "chat"],
        "phase-d-browser-scratchpad": ["browser", "preview", "scratchpad"],
        "phase-e-wasm-lsp-context": ["wasm", "lsp", "indexing", "context"],
        "phase-f-ai-web-runner": ["ai", "gateway", "runner", "web"],
        "review-and-sync": ["review", "sync", "check", "validate"]
    }
    
    matched = []
    for workflow, keywords in workflow_keywords.items():
        if any(kw in prompt_lower for kw in keywords):
            matched.append(workflow)
    
    if matched:
        print(f"📋 Suggested workflows: {', '.join(matched)}")
        return matched
    return None

def check_agents_available(workspace_root):
    """Check if .agents/skills directory exists."""
    agents_dir = workspace_root / ".agents" / "skills"
    if not agents_dir.exists():
        print(f"⚠️  .agents/skills directory not found")
        return False
    
    skill_count = len(list(agents_dir.glob("*/SKILL.md")))
    print(f"✓ .agents/skills found with {skill_count} skills available")
    return True

def main():
    workspace_root = Path.cwd()
    
    # Load context from stdin
    context = load_json_stdin()
    user_prompt = context.get("user_prompt", "")
    
    print(f"🔍 Pre-prompt validation for: {workspace_root}")
    print("-" * 50)
    
    # Check ARCHITECTURE.md
    check_architecture_compliance(workspace_root)
    
    # Check .agents availability
    check_agents_available(workspace_root)
    
    # Match workflow if prompt is provided
    if user_prompt:
        match_workflow(workspace_root, user_prompt)
    
    print("-" * 50)
    print("✓ Pre-prompt validation complete")
    
    # Exit code 0 = allow, 2 = block
    sys.exit(0)

if __name__ == "__main__":
    main()
