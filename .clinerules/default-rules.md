# Cline Project Rules — WebAssemblyIde

Bu repo için Cline davranış kurallarıdır. Her görevde bu dosya birincil talimat kabul edilir.

## 1. Zorunlu Proje Bağlamı

- Her mimari, kodlama, refactor veya dosya üretme görevinden önce `ARCHITECTURE.md` ve `TODO.md` bağlamını dikkate al.
- Bu proje **Monaco + Tauri + Rust/Wasm servisleri + custom Agent Runtime + AI Provider Gateway + Project Terminal + Embedded Browser + Scratchpad Runtime** mimarisine göre ilerlemelidir.
- VS Code/Codium doğrudan fork edilmemelidir; sadece tema, keybinding, snippet, grammar ve extension uyumluluk fikirleri kademeli alınmalıdır.
- Başlangıç uygulama sırası için önce `TODO.md` içindeki **"İlk Başlanacak Minimum İş Sırası"** bölümünü esas al.

## 2. Çalışma Protokolü

- Göreve başlamadan önce kısa hedef, teslimatlar, başarı kriterleri ve kısıtları belirle.
- Büyük işleri küçük, doğrulanabilir adımlara böl.
- Her uygulama adımı sonrası mümkünse build/test/lint veya dosya doğrulaması yap.
- Kullanıcının onayı olmadan yıkıcı işlem, paket kurulumu, global araç kurulumu, credential erişimi veya network tabanlı işlem yapma.
- Bu repoda tüm yeni uygulama iskeletleri lokal proje bağımlılıklarıyla kurulmalıdır; global paket varsayma.

## 3. Mimari Guardrail’ler

- Performans, hızlı startup, lazy loading, worker-first execution ve cache stratejileri her modül tasarımında düşünülmelidir.
- UI shell, terminal, browser, scratchpad, agent runtime, context engine ve AI gateway gevşek bağlı olmalıdır.
- Modüller doğrudan birbirine sıkı bağlanmamalı; `Command Bus`, `Event Bus` ve açık interface sözleşmeleri kullanılmalıdır.
- Agent Runtime doğrudan dosya/terminal/browser/scratchpad manipüle etmemeli; tüm aksiyonlar Tool Registry üzerinden yürümelidir.
- Scratchpad varsayılan olarak gerçek workspace’e yazmamalıdır; export/apply işlemleri açık kullanıcı onayı gerektirir.
- Embedded Browser introspection, console/network/DOM/screenshot erişimleri açık izin ve güvenlik sınırıyla yapılmalıdır.

## 4. Güvenlik ve AI Provider Kuralları

- Ana AI erişim modeli resmi API/BYOK/OAuth olmalıdır.
- Resmi API/OAuth olmayan ChatGPT/Claude web session scraping ana ürün stratejisi yapılmamalıdır.
- Subscription/session bridge yalnızca deneysel ve local user connector olarak ele alınabilir; ToS riski belgelenmelidir.
- Secret dosyaları, tokenlar, API key’ler ve credential değerleri düz metin olarak yazılmamalı veya loglanmamalıdır.
- Agent aksiyonları audit edilebilir tasarlanmalıdır: tool, input/output özeti, dosya değişiklikleri, onay durumu, diff ve hata bilgisi.

## 5. TODO ve Dokümantasyon Kuralları

- `TODO.md` maddelerini ancak gerçekten uygulanıp doğrulandığında ve kullanıcı bağlamı uygunsa tamamlandı işaretle.
- Sadece plan/doküman oluştururken TODO maddelerini otomatik tamamlanmış işaretleme.
- Mimari karar değişikliklerinde `ARCHITECTURE.md`, uygulama sırası değişikliklerinde `TODO.md` güncel tutulmalıdır.
- Yeni Cline kuralı, skill, workflow veya hook eklenirse `.clinerules/manifest.json` güncellenmelidir.
- Geriye dönük uyumluluk gerekiyorsa `.cline/manifest.json` da senkron tutulabilir; ancak bu projede Cline UI kaynakları öncelikle `.clinerules/` altından okunur.

## 6. Proje İçi Cline Kaynakları

Detaylı proje kuralları, skill’ler, workflow’lar ve hook şablonları aşağıdaki dizindedir:

- `.clinerules/rules/`
- `.agents/skills/<skill-name>/SKILL.md`
- `.clinerules/workflows/`
- `.clinerules/hooks/`
- `.clinerules/manifest.json`

Not: `.cline/` klasörü kullanılmaz. Görünür Cline workflow/rule/hook entegrasyonu için ana kaynak `.clinerules/`; skill entegrasyonu için ana kaynak `.agents/skills/` kabul edilir.

Görev tipine göre ilgili workflow ve skill dosyalarını referans al.
