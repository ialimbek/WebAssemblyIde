# Workflow: Phase D — Embedded Browser and Scratchpad

## Goal

Add browser preview and isolated scratchpad POCs without compromising workspace safety.

## Steps

1. Define Browser Runtime interface (see TODO.md 2.10).
2. Add Browser Panel and Preview Session Manager design (see TODO.md 2.10).
3. Define console/network/screenshot collectors behind permission boundary (see TODO.md 2.10).
4. Define Scratchpad Runtime interface (see TODO.md 2.11).
5. Add Temporary File System and Isolation Guard design (see TODO.md 2.11).
6. Add runtime template registry plan (see TODO.md 2.11).
7. Connect browser/scratchpad outputs to Context Engine interfaces (see TODO.md 2.10, 2.11, 2.14).
8. Add agent tool adapter contracts (see TODO.md 2.10, 2.11).
9. Add Scratchpad Terminal and Browser Preview connections (see TODO.md 2.11).

## Success Criteria

- Browser introspection is permission-gated.
- Scratchpad cannot write to workspace implicitly.
- Agent uses browser/scratchpad only through Tool Registry.
- Scratchpad export to workspace requires user approval.
