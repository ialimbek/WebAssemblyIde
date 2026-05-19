---
name: review-audit
description: Mimari uyum, güvenlik, performans, TODO/docs senkronu ve Cline kaynak doğrulaması için kullanılır.
---

# Review and Audit

## Checklist

- Değişiklik `ARCHITECTURE.md` ile uyumlu mu?
- Modül sınırları korunuyor mu?
- Agent Runtime doğrudan yan etki üretmek yerine Tool Registry kullanıyor mu?
- Permission, risk ve audit yolları açık mı?
- Startup/lazy loading kuralları korunuyor mu?
- Secret/token güvenliği sağlanıyor mu?
- TODO maddeleri yalnızca uygulanıp doğrulandıysa işaretlenmiş mi?
- `.clinerules/manifest.json` yeni rule/workflow/hook ve `.agents/skills` referanslarını içeriyor mu?

## Output

- Değişiklik özeti
- Riskler
- Gerekli düzeltmeler
- Doğrulama durumu
