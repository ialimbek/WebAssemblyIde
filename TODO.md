# TODO Listesi

Bu dosya, güncel `ARCHITECTURE.md` mimarisine göre en baştan düzenlenmiştir.

Amaç:

- Başlangıç fazlarını sadeleştirmek,
- Uygulamaya geçiş sırasını netleştirmek,
- Performans, hızlı açılış, DX, terminal, dahili tarayıcı, scratchpad, Agent Runtime, Wasm servisleri ve güvenlik katmanlarını detaylı görev listesine dönüştürmek.

Tüm maddeler başlangıç durumunda bırakılmıştır.

---

# 1. Basitleştirilmiş Başlangıç Fazları

Bu bölüm ilk uygulama sırasını sade tutmak içindir. Detaylı görevler sonraki bölümlerde yer alır.

## Faz A — Temel Proje İskeleti ve Hızlı Açılış

- [ ] Monorepo iskeletini oluştur
- [ ] Web ve desktop uygulama iskeletlerini oluştur
- [ ] Ortak TypeScript/Rust geliştirme standartlarını belirle
- [ ] Minimal uygulama shell’ini çalıştır
- [ ] Hızlı açılış hedefleri için `performance-core` temelini kur
- [ ] Panel bazlı lazy loading stratejisini hazırla

## Faz B — Editor, Workspace ve Proje Terminali

- [ ] Monaco tabanlı editor panelini oluştur
- [ ] Workspace explorer ve dosya açma akışını oluştur
- [ ] File System Abstraction katmanını kur
- [ ] Desktop workspace erişimini Tauri üzerinden bağla
- [ ] Projenin kendisine ait terminal runtime iskeletini oluştur
- [ ] Terminal output’unu UI ve context sistemine akıt

## Faz C — Agent Core ve Güvenli Tool Çalıştırma

- [ ] Agent Runtime iskeletini oluştur
- [ ] Chat Mode, Plan Mode ve sınırlı Act Mode akışını kur
- [ ] Tool Registry temel arayüzünü oluştur
- [ ] `read_file`, `search_files`, `apply_patch`, `run_command` araçlarını tasarla
- [ ] Approval workflow ve risk sınıflandırmasını ekle
- [ ] Agent action audit log modelini oluştur

## Faz D — Dahili Tarayıcı ve Scratchpad

- [ ] Embedded Browser panelini oluştur
- [ ] Local/remote preview session modelini tasarla
- [ ] Browser console/network log toplama akışını oluştur
- [ ] Scratchpad Runtime iskeletini oluştur
- [ ] Scratchpad için izole geçici çalışma alanı oluştur
- [ ] Agent’ın browser ve scratchpad verilerini context olarak kullanmasını sağla

## Faz E — Wasm, LSP, Indexing ve Context Engine

- [ ] Wasm parser/indexer/diff servislerinin POC kapsamını belirle
- [ ] Tree-sitter tabanlı sembol çıkarma POC oluştur
- [ ] LSP bridge arayüzünü oluştur
- [ ] Context Engine veri kaynaklarını bağla
- [ ] Incremental indexing ve cache stratejisini uygula
- [ ] Terminal, browser, scratchpad, git ve diagnostics context akışlarını birleştir

## Faz F — AI Gateway, Web Workspace ve Runner

- [ ] BYOK tabanlı AI provider bağlantılarını kur
- [ ] Model Router iskeletini oluştur
- [ ] Web workspace modelini tasarla
- [ ] Remote runner servis modelini oluştur
- [ ] Git-backed workspace ve PR workflow’unu planla
- [ ] MVP demo akışlarını uçtan uca doğrula

---

# 2. Detaylı Görev Kırılımı

## 2.1 Monorepo ve Proje Standartları

- [ ] Monorepo paket yöneticisini belirle
- [ ] Root `package.json` oluştur
- [ ] Workspace yapılandırmasını oluştur
- [ ] TypeScript `tsconfig` temel yapılandırmasını oluştur
- [ ] ESLint veya Biome kararını ver
- [ ] Format kurallarını belirle
- [ ] Git ignore kurallarını oluştur
- [ ] Ortak script isimlendirme standardını belirle
- [ ] `apps/desktop` klasörünü oluştur
- [ ] `apps/web` klasörünü oluştur
- [ ] `apps/docs` klasörünü oluştur
- [ ] `packages/shared` klasörünü oluştur
- [ ] `packages/ui` klasörünü oluştur
- [ ] `packages/editor` klasörünü oluştur
- [ ] `packages/ide-core` klasörünü oluştur
- [ ] `packages/command-bus` klasörünü oluştur
- [ ] `packages/performance-core` klasörünü oluştur
- [ ] `packages/terminal-runtime` klasörünü oluştur
- [ ] `packages/browser-runtime` klasörünü oluştur
- [ ] `packages/scratchpad-runtime` klasörünü oluştur
- [ ] `packages/agent-runtime` klasörünü oluştur
- [ ] `packages/agent-tools` klasörünü oluştur
- [ ] `packages/context-engine` klasörünü oluştur
- [ ] `packages/ai-gateway` klasörünü oluştur
- [ ] `packages/lsp-client` klasörünü oluştur
- [ ] `packages/extension-api` klasörünü oluştur
- [ ] `packages/devtools` klasörünü oluştur
- [ ] `crates/desktop-host` klasörünü oluştur
- [ ] `crates/wasm-parser` klasörünü oluştur
- [ ] `crates/wasm-indexer` klasörünü oluştur
- [ ] `crates/wasm-diff` klasörünü oluştur
- [ ] `services/api` klasörünü oluştur
- [ ] `services/auth` klasörünü oluştur
- [ ] `services/token-vault` klasörünü oluştur
- [ ] `services/runner` klasörünü oluştur

## 2.2 Hızlı Açılış ve Performance Core

- [ ] Critical Startup Path kapsamını kod seviyesinde tanımla
- [ ] App Shell açılış hedeflerini belirle
- [ ] İlk paint ve interactive startup ölçüm noktalarını tanımla
- [ ] Local performance profiler arayüzünü oluştur
- [ ] Startup metric veri modelini oluştur
- [ ] Lazy module registry tasarla
- [ ] Panel bazlı lazy loading altyapısını kur
- [ ] Monaco minimal loader stratejisini uygula
- [ ] Agent panel placeholder yaklaşımını uygula
- [ ] Terminal runtime lazy loading planını oluştur
- [ ] Embedded Browser runtime lazy loading planını oluştur
- [ ] Scratchpad runtime lazy loading planını oluştur
- [ ] Wasm servislerini deferred initialization ile başlatma stratejisi oluştur
- [ ] Workspace tree snapshot cache modelini tasarla
- [ ] Theme/keybinding cache modelini tasarla
- [ ] Recent workspace cache modelini oluştur
- [ ] Web için IndexedDB/OPFS cache stratejisini oluştur
- [ ] Desktop için SQLite/libSQL cache stratejisini oluştur
- [ ] Extension isolation prensibini teknik olarak belgelemeye hazırla
- [ ] Startup sırasında ağır servis başlatmayı engelleyen guard ekle

## 2.3 Frontend Shell ve Layout Sistemi

- [ ] React + TypeScript frontend iskeletini oluştur
- [ ] Vite build/dev yapılandırmasını oluştur
- [ ] Uygulama shell layout’unu oluştur
- [ ] Panel Registry tasarla
- [ ] Editor panel slotunu oluştur
- [ ] Agent panel slotunu oluştur
- [ ] Terminal panel slotunu oluştur
- [ ] Embedded Browser panel slotunu oluştur
- [ ] Scratchpad panel slotunu oluştur
- [ ] Explorer panel slotunu oluştur
- [ ] Search panel slotunu oluştur
- [ ] Problems/diagnostics panel slotunu oluştur
- [ ] Status bar iskeletini oluştur
- [ ] Activity bar / side bar iskeletini oluştur
- [ ] Command Palette temel UI’ını oluştur
- [ ] Theme Manager temelini oluştur
- [ ] Keybinding Manager temelini oluştur
- [ ] Panel açma/kapama state modelini oluştur
- [ ] Layout state persistence modelini oluştur
- [ ] UI modülleri için lazy import düzenini oluştur

## 2.4 Command Bus ve Event Bus

- [ ] Command Bus çekirdek arayüzünü tanımla
- [ ] Event Bus çekirdek arayüzünü tanımla
- [ ] Command payload tiplerini tanımla
- [ ] Event payload tiplerini tanımla
- [ ] User intent command modelini oluştur
- [ ] Workspace command modelini oluştur
- [ ] Terminal command modelini oluştur
- [ ] Browser command modelini oluştur
- [ ] Scratchpad command modelini oluştur
- [ ] Agent tool command modelini oluştur
- [ ] Command handler kayıt mekanizmasını oluştur
- [ ] Event subscriber mekanizmasını oluştur
- [ ] Hata yakalama ve command failure event modelini oluştur
- [ ] Audit edilecek command tiplerini belirle
- [ ] Mock command bus test altyapısını oluştur

## 2.5 Monaco Editor ve Editor Runtime

- [ ] Monaco Editor paket entegrasyonunu kur
- [ ] Editor model yönetim arayüzünü oluştur
- [ ] Dosya açma ve editor model oluşturma akışını kur
- [ ] Çoklu tab yönetimi oluştur
- [ ] Dirty state yönetimini oluştur
- [ ] Save akışını File System Abstraction’a bağla
- [ ] Diff editor kullanımını planla
- [ ] Patch preview için diff editor entegrasyonunu oluştur
- [ ] Theme entegrasyonunu bağla
- [ ] Keybinding entegrasyonunu bağla
- [ ] Diagnostics marker entegrasyonunu planla
- [ ] LSP semantic token entegrasyonunu planla
- [ ] Büyük dosya açma guard stratejisini belirle
- [ ] Editor state persistence modelini oluştur

## 2.6 Workspace Manager ve File System Abstraction

- [ ] Workspace Manager çekirdek arayüzünü tanımla
- [ ] Workspace metadata modelini oluştur
- [ ] File System Abstraction arayüzünü tanımla
- [ ] Desktop FS adapter tasarla
- [ ] Browser FS adapter tasarla
- [ ] OPFS adapter tasarla
- [ ] Git-backed workspace adapter tasarla
- [ ] Read file operation modelini oluştur
- [ ] Write file operation modelini oluştur
- [ ] Apply patch operation modelini oluştur
- [ ] List directory operation modelini oluştur
- [ ] Watch file changes modelini oluştur
- [ ] Workspace root permission modelini oluştur
- [ ] Workspace tree snapshot üretimini oluştur
- [ ] Workspace tree cache invalidation stratejisini oluştur
- [ ] Secret file pattern tespit mantığını planla
- [ ] Büyük repo için incremental scan stratejisini oluştur

## 2.7 Desktop Shell ve Tauri Host

- [ ] Tauri v2 uygulama iskeletini oluştur
- [ ] Rust command bridge temelini oluştur
- [ ] Tauri FS erişim izinlerini yapılandır
- [ ] Workspace klasörü seçme akışını oluştur
- [ ] Workspace root izin bilgisini güvenli şekilde sakla
- [ ] Native process manager tasarla
- [ ] Native PTY / ConPTY entegrasyon araştırmasını tamamla
- [ ] Tauri shell komut çalıştırma policy modelini oluştur
- [ ] Git komutları için native bridge tasarla
- [ ] Secure credential storage / OS keychain entegrasyonunu planla
- [ ] Desktop cache storage yolunu belirle
- [ ] Desktop log ve audit storage yolunu belirle
- [ ] Desktop/browser ortak frontend build bağlantısını kur

## 2.8 Web Shell ve Browser Workspace

- [ ] Browser SPA/PWA shell iskeletini oluştur
- [ ] File System Access API kullanılabilirlik kontrolünü ekle
- [ ] OPFS workspace modelini planla
- [ ] IndexedDB storage modelini planla
- [ ] Browser sandbox sınırlarını belirle
- [ ] Git-backed workspace konseptini tasarla
- [ ] GitHub repo import akışını planla
- [ ] GitLab repo import akışını planla
- [ ] Browser preview için iframe/proxy yaklaşımını planla
- [ ] Remote runner bağlantı modelini tasarla
- [ ] Web’de sınırlı Act Mode kapsamını netleştir
- [ ] Cross-origin kısıtları için güvenlik notlarını belgelemeye hazırla

## 2.9 Project Terminal Runtime

- [ ] Terminal Runtime paket arayüzünü oluştur
- [ ] Terminal Session Manager tasarla
- [ ] Terminal session veri modelini oluştur
- [ ] User Terminal türünü tanımla
- [ ] Agent Terminal türünü tanımla
- [ ] Task Terminal türünü tanımla
- [ ] Scratchpad Terminal türünü tanımla
- [ ] Shell Profile Resolver tasarla
- [ ] Windows CMD/PowerShell/WSL profil desteğini planla
- [ ] macOS zsh/bash profil desteğini planla
- [ ] Linux bash/zsh/fish profil desteğini planla
- [ ] PTY Bridge arayüzünü oluştur
- [ ] Desktop native PTY adapter tasarla
- [ ] Browser remote runner PTY adapter tasarla
- [ ] WASI/WebContainer terminal adapter seçeneklerini değerlendir
- [ ] Command Policy Guard tasarla
- [ ] Working Directory Guard tasarla
- [ ] Terminal output stream parser oluştur
- [ ] Terminal output’u UI’a stream et
- [ ] Terminal output’u Context Engine’e gönder
- [ ] Terminal komutlarını Audit Log’a gönder
- [ ] Test/lint/build output parser POC oluştur
- [ ] Terminal panel UI ile runtime bağlantısını kur

## 2.10 Embedded Browser Runtime

- [ ] Browser Runtime paket arayüzünü oluştur
- [ ] Browser Panel UI iskeletini oluştur
- [ ] Preview Session Manager tasarla
- [ ] Navigation Controller tasarla
- [ ] Dev Server Connector tasarla
- [ ] Localhost preview açma akışını planla
- [ ] Remote runner preview açma akışını planla
- [ ] Browser reload komutunu oluştur
- [ ] Console Log Collector tasarla
- [ ] Network Event Collector tasarla
- [ ] Screenshot capture adapter tasarla
- [ ] DOM summary adapter sınırlarını belirle
- [ ] Accessibility snapshot adapter planla
- [ ] Browser Security Boundary tasarla
- [ ] Browser introspection için kullanıcı izin akışını planla
- [ ] Browser state cache modelini oluştur
- [ ] Browser context verilerini Context Engine’e gönder
- [ ] Agent browser tools için adapter oluştur

## 2.11 Scratchpad Runtime

- [ ] Scratchpad Runtime paket arayüzünü oluştur
- [ ] Scratchpad Editor UI iskeletini oluştur
- [ ] Temporary File System modelini oluştur
- [ ] Scratchpad isolation guard tasarla
- [ ] Runtime Template Registry tasarla
- [ ] TypeScript/JavaScript template planla
- [ ] HTML/CSS/JS preview template planla
- [ ] Python template seçeneklerini değerlendir
- [ ] Rust/Wasm experiment template planla
- [ ] API request snippet template planla
- [ ] Browser worker execution adapter tasarla
- [ ] Desktop local sandbox adapter tasarla
- [ ] WASI sandbox adapter tasarla
- [ ] Remote runner execution adapter tasarla
- [ ] Scratchpad Result Panel oluştur
- [ ] Scratchpad Terminal bağlantısını planla
- [ ] Scratchpad Browser Preview bağlantısını planla
- [ ] Scratchpad sonuçlarını Context Engine’e gönder
- [ ] Scratchpad’den workspace’e export/apply akışını kullanıcı onayına bağla
- [ ] Agent scratchpad tool adapter oluştur

## 2.12 Agent Runtime

- [ ] Agent Runtime çekirdek paket sınırlarını tanımla
- [ ] Agent session veri modelini oluştur
- [ ] Agent state machine tasarla
- [ ] Chat Mode orchestrator oluştur
- [ ] Plan Mode orchestrator oluştur
- [ ] Limited Act Mode orchestrator oluştur
- [ ] Review Mode orchestrator planla
- [ ] Architect Mode orchestrator planla
- [ ] Prompt registry modelini tasarla
- [ ] Plan üretme prompt şablonlarını oluştur
- [ ] Repo okuma ve görev parçalama akışını tasarla
- [ ] Risk analizi ve etkilenen dosya listesi üretme akışını tasarla
- [ ] Kullanıcı onayı bekleme state’ini oluştur
- [ ] Patch önerme akışını oluştur
- [ ] Terminal ile test/lint/build çalıştırma akışını oluştur
- [ ] Browser ile preview doğrulama akışını oluştur
- [ ] Scratchpad ile çözüm deneme akışını oluştur
- [ ] Agent retry ve hata analizi döngüsünü tasarla
- [ ] Final diff ve açıklama üretme akışını oluştur

## 2.13 Agent Tool Registry

- [ ] Tool Registry çekirdek arayüzünü tanımla
- [ ] Tool manifest şemasını oluştur
- [ ] Tool input/output şemalarını oluştur
- [ ] Tool permission metadata modelini oluştur
- [ ] `read_file` tool tasarla
- [ ] `write_file` tool tasarla
- [ ] `apply_patch` tool tasarla
- [ ] `search_files` tool tasarla
- [ ] `list_files` tool tasarla
- [ ] `run_command` tool tasarla
- [ ] `git_diff` tool tasarla
- [ ] `run_tests` tool tasarla
- [ ] `open_preview` tool tasarla
- [ ] `reload_preview` tool tasarla
- [ ] `collect_console_logs` tool tasarla
- [ ] `collect_network_errors` tool tasarla
- [ ] `capture_screenshot` tool tasarla
- [ ] `scratchpad_execute` tool tasarla
- [ ] `lsp_diagnostics` tool tasarla
- [ ] `package_manager` tool tasarla
- [ ] Tool execution log formatını oluştur
- [ ] Tool hata formatını standartlaştır

## 2.14 Context Engine ve Memory

- [ ] Context Engine çekirdek arayüzünü tanımla
- [ ] Workspace scanner tasarla
- [ ] Symbol index modelini oluştur
- [ ] Dependency graph modelini oluştur
- [ ] Recent files context modelini oluştur
- [ ] Git diff context builder oluştur
- [ ] Terminal output memory oluştur
- [ ] Browser context builder oluştur
- [ ] Scratchpad context builder oluştur
- [ ] Diagnostics context builder oluştur
- [ ] Error output summarizer planla
- [ ] Context Ranker tasarla
- [ ] Context Budget Optimizer tasarla
- [ ] Embedding vector store stratejisini belirle
- [ ] Desktop SQLite/libSQL storage modelini oluştur
- [ ] Web IndexedDB storage modelini oluştur
- [ ] Cloud Postgres + pgvector modelini planla
- [ ] Incremental indexing stratejisini oluştur
- [ ] Context cache invalidation stratejisini oluştur
- [ ] Agent prompt context paketleme formatını oluştur

## 2.15 WebAssembly Servisleri

- [ ] Rust/Wasm crate workspace yapılandırmasını oluştur
- [ ] `wasm-parser` API sözleşmesini tanımla
- [ ] tree-sitter-wasm entegrasyonunu planla
- [ ] Symbol extraction POC oluştur
- [ ] AST summary üretim modelini oluştur
- [ ] `wasm-indexer` API sözleşmesini tanımla
- [ ] Code search/indexing POC oluştur
- [ ] Incremental index update modelini oluştur
- [ ] `wasm-diff` API sözleşmesini tanımla
- [ ] Diff/patch helper POC oluştur
- [ ] Git diff analyzer POC planla
- [ ] Wasm worker loading modelini oluştur
- [ ] Streaming instantiate kullanımını değerlendir
- [ ] Browser Wasm execution modelini tasarla
- [ ] Desktop Wasm execution modelini tasarla
- [ ] WASI Preview 2 kullanım alanlarını belirle
- [ ] Wasm servis hata formatını standartlaştır

## 2.16 LSP ve Dil Servisleri

- [ ] LSP client bridge arayüzünü oluştur
- [ ] LSP connection lifecycle modelini tasarla
- [ ] Desktop native LSP process manager tasarla
- [ ] stdio LSP bridge modelini oluştur
- [ ] websocket LSP bridge modelini oluştur
- [ ] TypeScript language server entegrasyonunu planla
- [ ] Python için Pyright/Ruff server entegrasyon kararını ver
- [ ] Rust için rust-analyzer entegrasyonunu planla
- [ ] Browser Web Worker LSP client modelini tasarla
- [ ] Remote LSP bridge modelini tasarla
- [ ] Diagnostics akışını Problems paneline bağla
- [ ] Diagnostics context builder bağlantısını kur
- [ ] Semantic tokens desteğini planla
- [ ] LSP performans ve lazy start stratejisini oluştur

## 2.17 AI Provider Gateway ve Model Router

- [ ] AI provider abstraction arayüzünü tanımla
- [ ] Model Router veri modelini oluştur
- [ ] Cost/context/capability bazlı routing kriterlerini tanımla
- [ ] Provider capability registry oluştur
- [ ] OpenAI connector tasarla
- [ ] Anthropic connector tasarla
- [ ] Google Gemini connector tasarla
- [ ] OpenRouter connector tasarla
- [ ] Local Ollama connector tasarla
- [ ] BYOK provider akışını oluştur
- [ ] API key doğrulama akışını planla
- [ ] Provider rate-limit modelini oluştur
- [ ] Provider error normalization modelini oluştur
- [ ] Streaming response arayüzünü tasarla
- [ ] Tool calling uyumluluk modelini planla
- [ ] Privacy seviyesi bazlı model seçme mantığını planla

## 2.18 Auth, Token Vault ve Subscription Riskleri

- [ ] BYOK ana erişim modelini güvenli saklama ile tasarla
- [ ] Desktop OS keychain saklama modelini planla
- [ ] Web backend token vault modelini planla
- [ ] Token encryption yaklaşımını belirle
- [ ] Token rotation ve revoke akışını planla
- [ ] Official OAuth destekleyen provider akışlarını planla
- [ ] OAuth callback ve refresh token modelini tasarla
- [ ] Enterprise KMS/HSM saklama opsiyonunu belgelemeye hazırla
- [ ] Local user connector deneysel kapsamını ayrı tut
- [ ] Session/scraping tabanlı entegrasyonların ToS risklerini belgelemeye hazırla
- [ ] Token erişim audit log modelini oluştur

## 2.19 Güvenlik, İzinler ve Governance

- [ ] Permission level enum modelini oluştur
- [ ] Observe izin seviyesini tanımla
- [ ] Suggest izin seviyesini tanımla
- [ ] Edit izin seviyesini tanımla
- [ ] Execute izin seviyesini tanımla
- [ ] Autonomous izin seviyesini tanımla
- [ ] Low risk action sınıflandırmasını oluştur
- [ ] Medium risk action sınıflandırmasını oluştur
- [ ] High risk action sınıflandırmasını oluştur
- [ ] Approval workflow UI ve runtime modelini tasarla
- [ ] Destructive command guard oluştur
- [ ] Secret file access guard planla
- [ ] Network upload guard planla
- [ ] Git push approval guard planla
- [ ] Browser introspection permission guard planla
- [ ] Scratchpad network permission guard planla
- [ ] Agent action audit log şemasını oluştur
- [ ] Prompt/context hash loglama modelini oluştur
- [ ] Resulting diff loglama modelini oluştur
- [ ] Policy violation error formatını oluştur

## 2.20 Git ve Workflow Entegrasyonu

- [ ] Git Manager arayüzünü tanımla
- [ ] Git status görüntüleme modelini oluştur
- [ ] Git diff viewer entegrasyonunu oluştur
- [ ] Working tree değişiklik modelini oluştur
- [ ] Branch oluşturma akışını tasarla
- [ ] Commit hazırlama akışını tasarla
- [ ] Agent patch’lerini git diff ile ilişkilendir
- [ ] PR oluşturma workflow’unu tasarla
- [ ] GitHub OAuth entegrasyonunu planla
- [ ] GitLab OAuth entegrasyonunu planla
- [ ] Git-backed web workspace modelini detaylandır
- [ ] PR tabanlı web agent workflow’unu tasarla

## 2.21 VS Code / Codium Uyumluluk Katmanı

- [ ] VS Code fork yapılmadan uyumluluk kapsamını netleştir
- [ ] Theme format desteğini planla
- [ ] Keybinding format desteğini planla
- [ ] Snippet format desteğini planla
- [ ] TextMate grammar desteğini planla
- [ ] Language configuration desteğini planla
- [ ] Open VSX entegrasyonunu planla
- [ ] Web extension API subset kapsamını belirle
- [ ] Extension Host compatibility layer için teknik araştırma yap
- [ ] Extension isolation prensibini performans hedefleriyle uyumlu hale getir
- [ ] Plugin SDK tasarım notlarını oluştur

## 2.22 Remote Runner ve Cloud Control Plane

- [ ] Remote runner servis sınırlarını tanımla
- [ ] Runner job veri modelini oluştur
- [ ] Runner workspace mount modelini planla
- [ ] Runner sandbox güvenlik modelini oluştur
- [ ] Browser terminal için remote PTY akışını tasarla
- [ ] Browser preview için dev server proxy akışını tasarla
- [ ] Test/lint/build komutlarını runner üzerinde çalıştırma modelini oluştur
- [ ] Runner log streaming modelini oluştur
- [ ] Runner output’u Context Engine’e bağlama modelini tasarla
- [ ] Cloud Control Plane API sınırlarını tanımla
- [ ] Auth servis iskeletini planla
- [ ] Token Vault servis iskeletini planla
- [ ] Provider Gateway servis iskeletini planla
- [ ] Audit Log servis iskeletini planla
- [ ] Policy/rate-limit katmanını planla

## 2.23 Dokümantasyon ve UML

- [ ] `docs/architecture.md` dokümanını oluştur
- [ ] `docs/security.md` dokümanını oluştur
- [ ] `docs/agent-runtime.md` dokümanını oluştur
- [ ] `docs/terminal-runtime.md` dokümanını oluştur
- [ ] `docs/browser-runtime.md` dokümanını oluştur
- [ ] `docs/scratchpad-runtime.md` dokümanını oluştur
- [ ] `docs/context-engine.md` dokümanını oluştur
- [ ] `docs/provider-integrations.md` dokümanını oluştur
- [ ] `docs/performance.md` dokümanını oluştur
- [ ] Subscription/session risk dokümanını oluştur
- [ ] Component diagram dokümanlarını güncel tut
- [ ] Sequence diagram dokümanlarını güncel tut
- [ ] Data flow diagram dokümanlarını güncel tut
- [ ] MVP demo kullanım dokümanını oluştur

## 2.24 Kalite, Test ve CI

- [ ] Unit test framework kararını ver
- [ ] Frontend unit test altyapısını kur
- [ ] Agent Runtime test altyapısını kur
- [ ] Tool Registry test senaryolarını oluştur
- [ ] Command Bus test senaryolarını oluştur
- [ ] Permission policy test senaryolarını oluştur
- [ ] Terminal Runtime test senaryolarını oluştur
- [ ] Browser Runtime test senaryolarını oluştur
- [ ] Scratchpad Runtime test senaryolarını oluştur
- [ ] Wasm service test senaryolarını oluştur
- [ ] LSP bridge test stratejisini belirle
- [ ] Desktop integration test stratejisini belirle
- [ ] Web integration test stratejisini belirle
- [ ] E2E demo test akışını planla
- [ ] CI pipeline tasarımını oluştur
- [ ] Build doğrulama komutlarını tanımla
- [ ] Lint/format kontrolünü CI’a ekle

## 2.25 MVP Demo Workflow’ları

- [ ] Repo açma demo senaryosunu oluştur
- [ ] İlk dosya açma ve hızlı startup demo senaryosunu oluştur
- [ ] Agent Plan Mode demo senaryosunu oluştur
- [ ] Agent sınırlı Act Mode demo senaryosunu oluştur
- [ ] Project Terminal ile test/lint çalıştırma demosu oluştur
- [ ] Embedded Browser preview demosu oluştur
- [ ] Browser console/network hata analizi demosu oluştur
- [ ] Scratchpad hızlı deneme demosu oluştur
- [ ] Agent’ın scratchpad ile çözüm doğrulama demosunu oluştur
- [ ] Patch preview/apply demosu oluştur
- [ ] Test sonrası hata düzeltme demosu oluştur
- [ ] Final diff ve açıklama demosu oluştur
- [ ] “Bug fix agent” demo akışını oluştur
- [ ] “Write tests agent” demo akışını oluştur
- [ ] “Refactor plan agent” demo akışını oluştur

---

# 3. İlk Başlanacak Minimum İş Sırası

Bu bölüm, uygulamaya geçildiğinde doğrudan takip edilecek en sade başlangıç sırasıdır.

- [ ] Monorepo ve temel klasör yapısını oluştur
- [ ] Web app ve desktop app iskeletlerini kur
- [ ] Minimal app shell’i çalıştır
- [ ] Performance Core için startup ölçüm iskeletini ekle
- [ ] Panel Registry ve lazy loading altyapısını oluştur
- [ ] Monaco Editor panelini bağla
- [ ] Workspace Manager ve File System Abstraction temelini oluştur
- [ ] Tauri üzerinden desktop workspace açma akışını bağla
- [ ] Project Terminal Runtime iskeletini oluştur
- [ ] Agent Runtime ve Tool Registry temelini oluştur
- [ ] `read_file`, `search_files`, `apply_patch`, `run_command` tool akışlarını tasarla
- [ ] Embedded Browser panel POC oluştur
- [ ] Scratchpad Runtime POC oluştur
- [ ] Context Engine’e terminal/browser/scratchpad veri kaynaklarını bağla
- [ ] BYOK AI provider connector POC oluştur
- [ ] İlk MVP demo akışını çalıştır
