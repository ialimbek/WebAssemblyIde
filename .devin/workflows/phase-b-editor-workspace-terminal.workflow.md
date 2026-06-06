# Workflow: Phase B — Editor, Workspace, and Terminal

## Goal

Add Monaco editor, workspace/file abstractions, and Project Terminal Runtime skeleton.

## Steps

1. Add Monaco editor panel as a lazy-loaded panel (see TODO.md 2.5).
2. Create Workspace Manager interfaces (see TODO.md 2.6).
3. Create File System Abstraction interfaces (see TODO.md 2.6).
4. Add desktop workspace open flow through Tauri boundary design (see TODO.md 2.7).
5. Add terminal runtime package boundary (see TODO.md 2.9).
6. Define terminal session types and PTY bridge interfaces (see TODO.md 2.9).
7. Stream terminal output to UI and Context Engine interfaces (see TODO.md 2.9).
8. Add Auto-save mechanism (see TODO.md 2.25).
9. Add Undo/Redo system foundation (see TODO.md 2.26).
10. Validate module boundaries and startup impact.

## Success Criteria

- Editor, workspace, FS, and terminal are loosely coupled.
- Terminal is policy-ready and context-ready.
- No direct Agent Runtime terminal manipulation exists.
- Auto-save prevents data loss.
- Undo/Redo foundation in place.
