# Cline Rules, Skills, Workflows and Hooks

Bu klasör, WebAssemblyIde projesi için Cline UI tarafından okunacak ana proje-yerel kaynak dizinidir.

## Kaynak Belgeler

- `../ARCHITECTURE.md`
- `../TODO.md`
- `default-rules.md`

## Yapı

```txt
.clinerules/
 ├─ manifest.json
 ├─ default-rules.md
 ├─ rules/
 ├─ workflows/
 └─ hooks/
```

Skill dosyaları Cline/Agents standardına göre ayrı kökte tutulur:

```txt
.agents/
 └─ skills/
    └─ <skill-name>/
       └─ SKILL.md
```

## Not

`.cline/` klasörü kullanılmaz. Cline arayüzünde rule/workflow/hook görünürlüğü için `.clinerules/`, skill görünürlüğü için `.agents/skills/` ana kaynak kabul edilir.