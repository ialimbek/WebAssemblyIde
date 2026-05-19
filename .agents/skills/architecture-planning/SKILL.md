---
name: architecture-planning
description: WebAssemblyIde mimarisine uygun faz bazlı plan, sınır ve doğrulama stratejisi üretir.
---

# Architecture Planning

## Usage

Mimari karar, refactor, paket sınırı, workflow tasarımı veya büyük uygulama planı gerektiğinde kullan.

## Required Context

- `ARCHITECTURE.md`
- `TODO.md`
- `.clinerules/default-rules.md`
- `.clinerules/rules/*`

## Steps

1. İsteği `TODO.md` fazları A-F ile eşleştir.
2. Etkilenen mimari katmanları belirle.
3. Goal, deliverables, success criteria, constraints ve validation başlıklarını çıkar.
4. Command Bus, Event Bus, Tool Registry ve açık interface sınırlarını koru.
5. Güvenlik, performans, startup ve cache etkilerini belirt.

## Output

- Faz bazlı uygulanabilir plan
- Etkilenen modül/dosya listesi
- Riskler ve mitigasyonlar
- Doğrulama yaklaşımı
