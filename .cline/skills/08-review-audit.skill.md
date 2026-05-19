# Skill: Review and Audit

## Use When

- Reviewing diffs.
- Auditing architecture or security changes.
- Checking TODO/docs sync.

## Review Checklist

- Does the change follow `ARCHITECTURE.md`?
- Does it preserve module boundaries?
- Does it avoid direct Agent Runtime side effects?
- Are permissions, risk levels, and audit paths clear?
- Are startup and lazy loading constraints respected?
- Are secrets protected?
- Are TODO updates justified by implemented and verified work?
- Is `.cline/manifest.json` updated for Cline resource changes?

## Output

- Summary of changes.
- Risks found.
- Required fixes.
- Validation status.
