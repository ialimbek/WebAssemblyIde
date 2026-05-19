# Cline Proje Konfigürasyonu

Bu klasör, WebAssemblyIde projesi için Cline’ın kullanacağı proje-yerel kuralları, skill tanımlarını, workflow’ları ve webhook şablonlarını içerir.

## Kaynak Belgeler

- `../ARCHITECTURE.md`
- `../TODO.md`
- `../.clinerules`

## Yapı

```txt
.cline/
 ├─ manifest.json
 ├─ rules/
 ├─ skills/
 ├─ workflows/
 └─ webhooks/
```

## Kullanım İlkesi

- Görev başlamadan önce `ARCHITECTURE.md` ve `TODO.md` dikkate alınır.
- Uygulama işlerinde `TODO.md` içindeki **İlk Başlanacak Minimum İş Sırası** önceliklidir.
- Mimari guardrail’ler `.clinerules` ve `.cline/rules/` altında tutulur.
- Skills dosyaları tekrar kullanılabilir uzmanlık paketleridir.
- Workflow dosyaları faz bazlı uygulama akışlarıdır.
- Webhook dosyaları ileride external event -> agent workflow eşlemesi için şablondur.
