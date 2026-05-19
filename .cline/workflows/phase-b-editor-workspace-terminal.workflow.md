# Workflow: Phase B — Editor, Workspace, and Terminal

## Goal

Add Monaco editor, workspace/file abstractions, and Project Terminal Runtime skeleton.

## Steps

1. Add Monaco editor panel as a lazy-loaded panel.
2. Create Workspace Manager interfaces.
3. Create File System Abstraction interfaces.
4. Add desktop workspace open flow through Tauri boundary design.
5. Add terminal runtime package boundary.
6. Define terminal session types and PTY bridge interfaces.
7. Stream terminal output to UI and Context Engine interfaces.
8. Validate module boundaries and startup impact.

## Success Criteria

- Editor, workspace, FS, and terminal are loosely coupled.
- Terminal is policy-ready and context-ready.
- No direct Agent Runtime terminal manipulation exists.
