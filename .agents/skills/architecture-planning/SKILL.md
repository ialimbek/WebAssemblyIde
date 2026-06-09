---
name: architecture-planning
description: Produces phase-based plans, boundaries, and validation strategies aligned to Codembly architecture.
---

# Architecture Planning

## Usage

Use when you need an architecture decision, refactor plan, package boundary design, workflow design, or a large implementation plan.

## Required Context

- `ARCHITECTURE.md`
- `TODO.md`
- `.clinerules/default-rules.md`
- `.clinerules/rules/*`
- `.devin/rules/*`

## Steps

1. Map the request to `TODO.md` phases A–G.
2. Identify affected architecture layers.
3. Define goal, deliverables, success criteria, constraints, and validation.
4. Preserve Command Bus, Event Bus, Tool Registry, and explicit interface boundaries.
5. Call out security, performance, startup, and cache implications.

## Output

- Phase-based actionable plan
- Affected modules/files list
- Risks and mitigations
- Validation approach
