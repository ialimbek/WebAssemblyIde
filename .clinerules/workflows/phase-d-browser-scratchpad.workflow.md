# Workflow: Phase D — Embedded Browser and Scratchpad

## Goal

Add browser preview and isolated scratchpad POCs without compromising workspace safety.

## Steps

1. Define Browser Runtime interface.
2. Add Browser Panel and Preview Session Manager design.
3. Define console/network/screenshot collectors behind permission boundary.
4. Define Scratchpad Runtime interface.
5. Add Temporary File System and Isolation Guard design.
6. Add runtime template registry plan.
7. Connect browser/scratchpad outputs to Context Engine interfaces.
8. Add agent tool adapter contracts.

## Success Criteria

- Browser introspection is permission-gated.
- Scratchpad cannot write to workspace implicitly.
- Agent uses browser/scratchpad only through Tool Registry.
