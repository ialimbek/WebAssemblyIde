# Skill: Architecture Planning

## Use When

- Designing or changing major architecture.
- Creating package/crate/service boundaries.
- Translating `ARCHITECTURE.md` into actionable implementation plans.

## Inputs

- User request
- `ARCHITECTURE.md`
- `TODO.md`
- Current repository structure

## Procedure

1. Identify affected architecture layers.
2. Map the request to TODO phases A–F.
3. Define goal, deliverables, success criteria, constraints, and validation.
4. Preserve Command Bus/Event Bus/Tool Registry boundaries.
5. Explicitly call out security, performance, startup, and cache implications.

## Output

- A concrete phase-aware plan.
- Affected modules/files.
- Risks and mitigations.
- Verification steps.
