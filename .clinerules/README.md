# Cline Rules, Skills, Workflows and Hooks

This folder is the primary project-local resources directory for WebAssemblyIde, intended to be read by the Cline UI.

## Source Documents

- `../ARCHITECTURE.md`
- `../TODO.md`
- `default-rules.md`

## Structure

```txt
.clinerules/
 ├─ manifest.json
 ├─ default-rules.md
 ├─ rules/
 ├─ workflows/
 └─ hooks/
```

Skill files follow the Cline/Agents convention and are stored under a separate root:

```txt
.agents/
 └─ skills/
    └─ <skill-name>/
       └─ SKILL.md
```

## Notes

The `.cline/` folder is not used. For visible Cline rule/workflow/hook integration, `.clinerules/` is the source of truth; for skills integration, `.agents/skills/` is the source of truth.