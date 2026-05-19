---
name: review-audit
description: Use for architecture alignment, security, performance, TODO/docs sync, and Cline resource validation.
---

# Review and Audit

## Checklist

- Is the change aligned with `ARCHITECTURE.md`?
- Are module boundaries preserved?
- Does Agent Runtime orchestrate via Tool Registry rather than producing direct side effects?
- Are permission, risk, and audit paths explicit?
- Are startup/lazy loading constraints respected?
- Are secrets/tokens handled safely?
- Are TODO items marked done only if implemented and verified?
- Does `.clinerules/manifest.json` include new rule/workflow/hook references and `.agents/skills` references?

## Output

- Change summary
- Risks
- Required fixes
- Validation status
