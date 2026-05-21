# TODO Listesi

Bu dosya, güncel `ARCHITECTURE.md` mimarisine göre en baştan düzenlenmiştir.

Amaç:

- Başlangıç fazlarını sadeleştirmek,
- Uygulamaya geçiş sırasını netleştirmek,
- Performans, hızlı açılış, DX, terminal, dahili tarayıcı, scratchpad, Agent Runtime, Wasm servisleri, erişilebilirlik, i18n, offline destek ve güvenlik katmanlarını detaylı görev listesine dönüştürmek.

Maddeler uygulama ilerledikçe işaretlenecektir. Faz A durum işaretlemeleri 2026-05-21 tarihinde doğrulama çıktılarıyla güncellenmiştir.

---

# 1. Basitleştirilmiş Başlangıç Fazları

Bu bölüm ilk uygulama sırasını sade tutmak içindir. Detaylı görevler sonraki bölümlerde yer alır.

## Faz A — Temel Proje İskeleti ve Hızlı Açılış

- [x] Monorepo iskeletini oluştur
- [x] Web ve desktop uygulama iskeletlerini oluştur
- [x] Ortak TypeScript/Rust geliştirme standartlarını belirle
- [x] Minimal uygulama shell'ini çalıştır
- [x] Hızlı açılış hedefleri için `performance-core` temelini kur
- [x] Panel bazlı lazy loading stratejisini hazırla
- [x] Error boundary temelini oluştur
- [x] Settings management temelini oluştur

### Faz A — Detaylı Task Planı ve Durum

- [x] Task A.1 — Monorepo sınırlarını oluştur ve doğrula: `apps/`, `packages/`, `crates/`, `services/` klasörleri mevcut.
- [x] Task A.2 — Web app iskeletini kur: React + TypeScript + Vite yapılandırması ve web build doğrulandı.
- [x] Task A.3 — Desktop app iskeletini kur: Tauri v2 `src-tauri` yapısı mevcut, web build/dev bağlantısı `apps/web` çıktısına bağlandı.
- [x] Task A.4 — TypeScript/Rust standartlarını belirle: root `tsconfig`, ESLint, `.editorconfig`, root Cargo workspace ve `rustfmt.toml` eklendi/doğrulandı.
- [x] Task A.5 — Minimal shell'i çalıştır: Vite smoke test `http://127.0.0.1:3000` için `200` ve `#root` doğrulaması verdi.
- [x] Task A.6 — `performance-core` temelini güçlendir: startup profiler, lazy module registry, startup contract/guard ve testleri eklendi.
- [x] Task A.7 — Panel/lazy loading temelini doğrula: `PanelRegistry`, `LayoutManager`, `LazyModuleRegistry` ve deferred startup listesi mevcut.
- [x] Task A.8 — Error boundary ve settings temellerini bağla: `ErrorBoundary` web/desktop shell'de kullanılıyor, `SettingsManager` hiyerarşik temel sağlıyor.
- [x] Task A.9 — Faz A doğrulaması: `npm run build`, `npm run test`, `npm run lint`, `npm run build --workspace=@webassembly-ide/web`, `cargo metadata`, `cargo fmt --all -- --check`, `cargo check --workspace` başarılı.
- Faz A eksik: - Yok.
- Faz A sonrası ilk bekleyen işler:
  - [ ] Monaco Editor panelini bağla
  - [ ] Workspace Manager ve File System Abstraction temelini oluştur
  - [ ] Tauri üzerinden desktop workspace açma akışını bağla

## Faz B — Editor, Workspace ve Proje Terminali

- [ ] Monaco tabanlı editor panelini oluştur
- [ ] Workspace explorer ve dosya açma akışını oluştur
- [ ] File System Abstraction katmanını kur
- [ ] Desktop workspace erişimini Tauri üzerinden bağla
- [ ] Projenin kendisine ait terminal runtime iskeletini oluştur
- [ ] Terminal output'unu UI ve context sistemine akıt
- [ ] Auto-save mekanizmasını kur
- [ ] Undo/Redo temel altyapısını oluştur

## Faz C — Agent Core ve Güvenli Tool Çalıştırma

- [ ] Agent Runtime iskeletini oluştur
- [ ] Chat Mode, Plan Mode ve sınırlı Act Mode akışını kur
- [ ] Tool Registry temel arayüzünü oluştur
- [ ] `read_file`, `search_files`, `apply_patch`, `run_command` araçlarını tasarla
- [ ] Approval workflow ve risk sınıflandırmasını ekle
- [ ] Agent action audit log modelini oluştur
- [ ] Agent action undo desteğini ekle

## Faz D — Dahili Tarayıcı ve Scratchpad

- [ ] Embedded Browser panelini oluştur
- [ ] Local/remote preview session modelini tasarla
- [ ] Browser console/network log toplama akışını oluştur
- [ ] Scratchpad Runtime iskeletini oluştur
- [ ] Scratchpad için izole geçici çalışma alanı oluştur
- [ ] Agent'ın browser ve scratchpad verilerini context olarak kullanmasını sağla

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
- [ ] Git-backed workspace ve PR workflow'unu planla
- [ ] MVP demo akışlarını uçtan uca doğrula

## Faz G — Erişilebilirlik, i18n, Bildirim ve Offline Destek

- [ ] Accessibility (WCAG 2.1 AA) temel desteğini ekle
- [ ] i18n message key sistemini kur
- [ ] Notification system temelini oluştur
- [ ] Keyboard navigation manager'ı kur
- [ ] Offline support stratejisini uygula (Service Worker + OPFS)
- [ ] Desktop auto-update mekanizmasını planla

---

# 2. Detaylı Görev Kırılımı

## 2.1 Monorepo ve Proje Standartları

- [x] Monorepo paket yöneticisini belirle
- [x] Root `package.json` oluştur
- [x] Workspace yapılandırmasını oluştur
- [x] TypeScript `tsconfig` temel yapılandırmasını oluştur
- [x] ESLint veya Biome kararını ver
- [x] Format kurallarını belirle
- [x] Git ignore kurallarını oluştur
- [x] Ortak script isimlendirme standardını belirle
- [x] `apps/desktop` klasörünü oluştur
- [x] `apps/web` klasörünü oluştur
- [x] `apps/docs` klasörünü oluştur
- [x] `packages/shared` klasörünü oluştur
- [x] `packages/ui` klasörünü oluştur
- [x] `packages/editor` klasörünü oluştur
- [x] `packages/ide-core` klasörünü oluştur
- [x] `packages/command-bus` klasörünü oluştur
- [x] `packages/performance-core` klasörünü oluştur
- [x] `packages/terminal-runtime` klasörünü oluştur
- [x] `packages/browser-runtime` klasörünü oluştur
- [x] `packages/scratchpad-runtime` klasörünü oluştur
- [x] `packages/agent-runtime` klasörünü oluştur
- [x] `packages/agent-tools` klasörünü oluştur
- [x] `packages/context-engine` klasörünü oluştur
- [x] `packages/ai-gateway` klasörünü oluştur
- [x] `packages/lsp-client` klasörünü oluştur
- [x] `packages/extension-api` klasörünü oluştur
- [x] `packages/devtools` klasörünü oluştur
- [x] `packages/i18n` klasörünü oluştur
- [x] `packages/accessibility` klasörünü oluştur
- [x] `packages/settings` klasörünü oluştur
- [x] `packages/notifications` klasörünü oluştur
- [x] `crates/desktop-host` klasörünü oluştur
- [x] `crates/wasm-parser` klasörünü oluştur
- [x] `crates/wasm-indexer` klasörünü oluştur
- [x] `crates/wasm-diff` klasörünü oluştur
- [x] `services/api` klasörünü oluştur
- [x] `services/auth` klasörünü oluştur
- [x] `services/token-vault` klasörünü oluştur
- [x] `services/runner` klasörünü oluştur

## 2.2 Hızlı Açılış ve Performance Core

- [x] Critical Startup Path kapsamını kod seviyesinde tanımla
- [x] App Shell açılış hedeflerini belirle
- [x] İlk paint ve interactive startup ölçüm noktalarını tanımla
- [x] Local performance profiler arayüzünü oluştur
- [x] Startup metric veri modelini oluştur
- [x] Lazy module registry tasarla
- [x] Panel bazlı lazy loading altyapısını kur
- [x] Monaco minimal loader stratejisini uygula
- [x] Agent panel placeholder yaklaşımını uygula
- [x] Terminal runtime lazy loading planını oluştur
- [x] Embedded Browser runtime lazy loading planını oluştur
- [x] Scratchpad runtime lazy loading planını oluştur
- [x] Wasm servislerini deferred initialization ile başlatma stratejisi oluştur
- [ ] Workspace tree snapshot cache modelini tasarla
- [ ] Theme/keybinding cache modelini tasarla
- [ ] Recent workspace cache modelini oluştur
- [ ] Web için IndexedDB/OPFS cache stratejisini oluştur
- [ ] Desktop için SQLite/libSQL cache stratejisini oluştur
- [ ] Extension isolation prensibini teknik olarak belgelemeye hazırla
- [x] Startup sırasında ağır servis başlatmayı engelleyen guard ekle

## 2.3 Frontend Shell ve Layout Sistemi

- [x] React + TypeScript frontend iskeletini oluştur
- [x] Vite build/dev yapılandırmasını oluştur
- [x] Uygulama shell layout'unu oluştur
- [x] Panel Registry tasarla
- [x] Editor panel slotunu oluştur
- [ ] Agent panel slotunu oluştur
- [x] Terminal panel slotunu oluştur
- [ ] Embedded Browser panel slotunu oluştur
- [ ] Scratchpad panel slotunu oluştur
- [x] Explorer panel slotunu oluştur
- [ ] Search panel slotunu oluştur
- [x] Problems/diagnostics panel slotunu oluştur
- [x] Status bar iskeletini oluştur
- [x] Activity bar / side bar iskeletini oluştur
- [ ] Command Palette temel UI'ını oluştur
- [ ] Theme Manager temelini oluştur
- [ ] Keybinding Manager temelini oluştur
- [x] Panel açma/kapama state modelini oluştur
- [ ] Layout state persistence modelini oluştur
- [ ] UI modülleri için lazy import düzenini oluştur

## 2.4 Command Bus ve Event Bus

- [x] Command Bus çekirdek arayüzünü tanımla
- [x] Event Bus çekirdek arayüzünü tanımla
- [x] Command payload tiplerini tanımla
- [x] Event payload tiplerini tanımla
- [x] User intent command modelini oluştur
- [x] Workspace command modelini oluştur
- [x] Terminal command modelini oluştur
- [ ] Browser command modelini oluştur
- [ ] Scratchpad command modelini oluştur
- [ ] Agent tool command modelini oluştur
- [x] Command handler kayıt mekanizmasını oluştur
- [x] Event subscriber mekanizmasını oluştur
- [ ] Hata yakalama ve command failure event modelini oluştur
- [ ] Audit edilecek command tiplerini belirle
- [ ] Mock command bus test altyapısını oluştur

## 2.5 Monaco Editor ve Editor Runtime

- [ ] Monaco Editor paket entegrasyonunu kur
- [ ] Editor model yönetim arayüzünü oluştur
- [ ] Dosya açma ve editor model oluşturma akışını kur
- [ ] Çoklu tab yönetimi oluştur
- [ ] Dirty state yönetimini oluştur
- [ ] Save akışını File System Abstraction'a bağla
- [ ] Diff editor kullanımını planla
- [ ] Patch preview için diff editor entegrasyonunu oluştur
- [ ] Theme entegrasyonunu bağla
- [ ] Keybinding entegrasyonunu bağla
- [ ] Diagnostics marker entegrasyonunu planla
- [ ] LSP semantic token entegrasyonunu planla
- [ ] Büyük dosya açma guard stratejisini belirle
- [ ] Editor state persistence modelini oluştur
- [ ] Monaco editor erişilebilirlik API entegrasyonunu yap

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

- [x] Tauri v2 uygulama iskeletini oluştur
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
- [x] Desktop/browser ortak frontend build bağlantısını kur
- [ ] Desktop auto-update mekanizmasını kur

## 2.8 Web Shell ve Browser Workspace

- [x] Browser SPA/PWA shell iskeletini oluştur
- [ ] File System Access API kullanılabilirlik kontrolünü ekle
- [ ] OPFS workspace modelini planla
- [ ] IndexedDB storage modelini planla
- [ ] Browser sandbox sınırlarını belirle
- [ ] Git-backed workspace konseptini tasarla
- [ ] GitHub repo import akışını planla
- [ ] GitLab repo import akışını planla
- [ ] Browser preview için iframe/proxy yaklaşımını planla
- [ ] Remote runner bağlantı modelini tasarla
- [ ] Web'de sınırlı Act Mode kapsamını netleştir
- [ ] Cross-origin kısıtları için güvenlik notlarını belgelemeye hazırla
- [ ] Service Worker caching stratejisini oluştur
- [ ] Offline support implementation planını oluştur

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
- [ ] Terminal output'u UI'a stream et
- [ ] Terminal output'u Context Engine'e gönder
- [ ] Terminal komutlarını Audit Log'a gönder
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
- [ ] Browser context verilerini Context Engine'e gönder
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
- [ ] Scratchpad sonuçlarını Context Engine'e gönder
- [ ] Scratchpad'den workspace'e export/apply akışını kullanıcı onayına bağla
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
- [ ] Kullanıcı onayı bekleme state'ini oluştur
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
- [ ] Agent patch'lerini git diff ile ilişkilendir
- [ ] PR oluşturma workflow'unu tasarla
- [ ] GitHub OAuth entegrasyonunu planla
- [ ] GitLab OAuth entegrasyonunu planla
- [ ] Git-backed web workspace modelini detaylandır
- [ ] PR tabanlı web agent workflow'unu tasarla

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
- [ ] Runner output'u Context Engine'e bağlama modelini tasarla
- [ ] Cloud Control Plane API sınırlarını tanımla
- [ ] Auth servis iskeletini planla
- [ ] Token Vault servis iskeletini planla
- [ ] Provider Gateway servis iskeletini planla
- [ ] Audit Log servis iskeletini planla
- [ ] Policy/rate-limit katmanını planla
- [ ] Settings Sync servisini planla

## 2.23 Erişilebilirlik (Accessibility)

- [ ] WCAG 2.1 AA uyumluluk kontrol listesi oluştur
- [ ] Screen Reader bridge tasarla (NVDA, JAWS, VoiceOver)
- [ ] Focus Manager uygula
- [ ] ARIA Live Region Manager oluştur
- [ ] Keyboard Navigation Tree oluştur
- [ ] Theme Contrast Checker uygula
- [ ] Monaco editor accessibility API entegrasyonu yap
- [ ] Panel açma/kapama ekran okuyucu bildirimleri ekle
- [ ] Terminal output ekran okuyucu uyumluluğu sağla
- [ ] Agent mesajları ve diff preview erişilebilirliği sağla
- [ ] Form ve input alanları label/ARIA desteği ekle
- [ ] Motion reduction desteği ekle

## 2.24 Uluslararasılaştırma (i18n)

- [ ] Message key-value sistemini kur
- [ ] Message Registry oluştur
- [ ] Locale Loader tasarla
- [ ] Fallback Chain Handler oluştur
- [ ] RTL Layout Adapter tasarla
- [ ] Format Provider (date, number, currency) oluştur
- [ ] UI string'lerini key-value formatına taşı
- [ ] Agent mesajları ve prompt'ları çoklu dil desteği ekle
- [ ] İlk dil paketlerini hazırla (EN, TR, ES, FR, DE, JA, ZH)
- [ ] Settings'ten dil seçimi UI'ını oluştur

## 2.25 Otomatik Kayıt ve Veri Kaybı Önleme

- [ ] Auto-save debounced save mekanizmasını kur
- [ ] On focus loss save uygula
- [ ] On tab close save uygula
- [ ] On IDE shutdown save uygula
- [ ] On crash/force close recovery tasarla
- [ ] External file change conflict resolution uygula
- [ ] Unsaved changes tracker oluştur
- [ ] Dirty file indicator ekle
- [ ] Save confirmation dialog tasarla
- [ ] Crash recovery backup store kur
- [ ] Periodic unsaved file backup uygula
- [ ] IDE crash recovery state restore yap

## 2.26 Geri Alma/Yineleme (Undo/Redo) Sistemi

- [ ] Command History Stack tasarla
- [ ] File content change undo desteği ekle
- [ ] File create/delete/rename undo desteği ekle
- [ ] Agent patch application undo desteği ekle
- [ ] Terminal command execution undo desteği ekle
- [ ] Git operation (commit, stash) undo desteği ekle
- [ ] Configuration change undo desteği ekle
- [ ] Character-level (editor) undo desteği
- [ ] Transaction-level (agent actions) undo desteği
- [ ] Agent multi-file patch atomic undo tasarla
- [ ] Cross-file undo desteği ekle
- [ ] Redo stack management uygula
- [ ] Undo/redo history visualization oluştur

## 2.27 Bildirim Sistemi

- [ ] Notification Registry oluştur
- [ ] Notification Queue tasarla
- [ ] Priority Levels uygula (Critical, High, Medium, Low)
- [ ] Toast notification sistemi kur
- [ ] Status bar message desteği ekle
- [ ] Badge indicator sistemi kur
- [ ] Problem panel entry notification entegrasyonu
- [ ] Agent message panel notification entegrasyonu
- [ ] Auto-dismiss with timeout uygula
- [ ] Manual dismiss desteği ekle
- [ ] Do not disturb mode tasarla
- [ ] Notification History oluştur

## 2.28 Klavye Navigasyonu

- [ ] Global keybinding registry oluştur
- [ ] Vim-like navigation mode tasarla
- [ ] Command palette quick access (Ctrl+P) uygula
- [ ] Panel focus cycling (Ctrl+Tab) ekle
- [ ] Go to line (Ctrl+G) uygula
- [ ] Go to symbol (Ctrl+Shift+O) uygula
- [ ] Go to definition (F12) uygula
- [ ] Find references (Shift+F12) uygula
- [ ] Terminal keyboard mode (Ctrl+`) uygula
- [ ] Vim/emacs keybinding support ekle
- [ ] Accessibility keyboard mode tasarla

## 2.29 Yapılandırma ve Ayar Yönetimi

- [x] Settings Hierarchy tasarla (Default, Workspace, User, Project)
- [x] Settings Types uygula (Boolean, Number, String, Enum, Object/JSON, File path)
- [ ] Settings Sync mekanizması kur (Cloud, GitHub Gist, Local backup/export)
- [ ] VS Code settings import desteği ekle
- [ ] Agent Rules Configuration (.cursorrules/.clinerules) desteği
- [ ] Agent behavior constraints ayarları
- [ ] Tool permission overrides ayarları
- [ ] Provider/model preferences ayarları
- [ ] Settings panel with search UI oluştur
- [ ] Category navigation UI oluştur
- [ ] Modified indicator ve Reset to default fonksiyonları
- [ ] Settings JSON edit mode ekle

## 2.30 Hata Yönetimi ve Kurtarma

- [x] Application-level error boundary oluştur
- [x] Panel-level error boundary oluştur
- [ ] Editor-level error boundary oluştur
- [ ] Agent Runtime error boundary oluştur
- [ ] Terminal Runtime error boundary oluştur
- [ ] Browser Runtime error boundary oluştur
- [ ] Wasm service error boundary oluştur
- [ ] Session state persistence uygula
- [ ] Auto-restart on crash mekanizması kur
- [ ] State restore on relaunch uygula
- [ ] Error report generation tasarla
- [ ] Diagnostic bundle export oluştur
- [ ] Safe mode fallback uygula
- [ ] Local error log sistemi kur
- [ ] User-friendly error messages tasarla
- [ ] Error code ve troubleshooting link sistemi
- [ ] Optional anonymous error telemetry
- [ ] Crash dump generation
- [ ] Support ticket preparation

## 2.31 Versiyon Güncelleme Stratejisi

- [ ] Update Channel sistemi (Stable, Beta, Nightly/Insiders)
- [ ] Periodic check (background) uygula
- [ ] Manual check (user action) ekle
- [ ] Forced update (security critical) mekanizması
- [ ] Silent download (background) uygula
- [ ] Download progress indicator ekle
- [ ] Install on restart mekanizması
- [ ] Previous version retention uygula
- [ ] Rollback on failed update mekanizması
- [ ] Manual downgrade option ekle
- [ ] In-app changelog display oluştur
- [ ] Link to full release notes ekle
- [ ] Breaking change warnings sistemi
- [ ] Web: Service Worker update strategy
- [ ] Web: Force refresh on critical update
- [ ] Web: Update notification banner
- [ ] Web: Backward compatibility window

## 2.32 Dokümantasyon ve UML

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
- [ ] `docs/accessibility.md` dokümanını oluştur
- [ ] `docs/i18n.md` dokümanını oluştur
- [ ] `docs/settings.md` dokümanını oluştur
- [ ] Component diagram dokümanlarını güncel tut
- [ ] Sequence diagram dokümanlarını güncel tut
- [ ] Data flow diagram dokümanlarını güncel tut
- [ ] MVP demo kullanım dokümanını oluştur

## 2.33 Kalite, Test ve CI

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
- [ ] Lint/format kontrolünü CI'a ekle

## 2.34 MVP Demo Workflow'ları

- [ ] Repo açma demo senaryosunu oluştur
- [ ] İlk dosya açma ve hızlı startup demo senaryosunu oluştur
- [ ] Agent Plan Mode demo senaryosunu oluştur
- [ ] Agent sınırlı Act Mode demo senaryosunu oluştur
- [ ] Project Terminal ile test/lint çalıştırma demosu oluştur
- [ ] Embedded Browser preview demosu oluştur
- [ ] Browser console/network hata analizi demosu oluştur
- [ ] Scratchpad hızlı deneme demosu oluştur
- [ ] Agent'ın scratchpad ile çözüm doğrulama demosunu oluştur
- [ ] Patch preview/apply demosu oluştur
- [ ] Test sonrası hata düzeltme demosu oluştur
- [ ] Final diff ve açıklama demosu oluştur
- [ ] "Bug fix agent" demo akışını oluştur
- [ ] "Write tests agent" demo akışını oluştur
- [ ] "Refactor plan agent" demo akışını oluştur

---

# 3. İlk Başlanacak Minimum İş Sırası

Bu bölüm, uygulamaya geçildiğinde doğrudan takip edilecek en sade başlangıç sırasıdır.

- [x] Monorepo ve temel klasör yapısını oluştur
- [x] Web app ve desktop app iskeletlerini kur
- [x] Minimal app shell'i çalıştır
- [x] Performance Core için startup ölçüm iskeletini ekle
- [x] Panel Registry ve lazy loading altyapısını oluştur
- [ ] Monaco Editor panelini bağla
- [ ] Workspace Manager ve File System Abstraction temelini oluştur
- [ ] Tauri üzerinden desktop workspace açma akışını bağla
- [ ] Project Terminal Runtime iskeletini oluştur
- [ ] Agent Runtime ve Tool Registry temelini oluştur
- [ ] `read_file`, `search_files`, `apply_patch`, `run_command` tool akışlarını tasarla
- [ ] Embedded Browser panel POC oluştur
- [ ] Scratchpad Runtime POC oluştur
- [ ] Context Engine'e terminal/browser/scratchpad veri kaynaklarını bağla
- [ ] BYOK AI provider connector POC oluştur
- [ ] Auto-save mekanizmasını kur
- [ ] Undo/Redo temel altyapısını oluştur
- [x] Error boundary temelini oluştur
- [x] Settings management temelini oluştur
- [ ] Accessibility (WCAG 2.1 AA) temel desteğini ekle
- [ ] i18n message key sistemini kur
- [ ] İlk MVP demo akışını çalıştır
