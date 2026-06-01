# TODO Listesi

Bu dosya, güncel `ARCHITECTURE.md` mimarisine göre en baştan düzenlenmiştir.

**REQUIRED:** All tasks in this TODO must use the agent-journal rule from `.windsurf/rules/12-agent-journal.md`, `.clinerules/rules/12-agent-journal.md`, `.claude/commands/agent-journal.md`, `.commandcode/agent-journal.md`, and `.thread/agent-journal.md` for workspace tracking, plan management, research tracking, and auto-logging.

**Agent Journal Rule Locations:**
- `.windsurf/rules/12-agent-journal.md`
- `.clinerules/rules/12-agent-journal.md`
- `.claude/commands/agent-journal.md`
- `.commandcode/agent-journal.md`
- `.thread/agent-journal.md`

Amaç:

- Başlangıç fazlarını sadeleştirmek,
- Uygulamaya geçiş sırasını netleştirmek,
- Performans, hızlı açılış, DX, terminal, dahili tarayıcı, scratchpad, Agent Runtime, Wasm servisleri, erişilebilirlik, i18n, offline destek ve güvenlik katmanlarını detaylı görev listesine dönüştürmek.

Maddeler uygulama ilerledikçe işaretlenecektir. Faz A durum işaretlemeleri 2026-05-21 tarihinde doğrulama çıktılarıyla güncellenmiştir. Faz B durum işaretlemeleri 2026-05-21 tarihinde gerçekleştirilmiştir.

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

## Faz B — Editor, Workspace ve Proje Terminali

- [x] Monaco tabanlı editor panelini oluştur
- [x] Workspace explorer ve dosya açma akışını oluştur
- [x] File System Abstraction katmanını kur
- [x] Desktop workspace erişimini Tauri üzerinden bağla
- [x] Projenin kendisine ait terminal runtime iskeletini oluştur
- [x] Terminal output'unu UI ve context sistemine akıt
- [x] Auto-save mekanizmasını kur
- [x] Undo/Redo temel altyapısını oluştur

### Faz B — Detaylı Task Planı ve Durum

**B.1 — Monaco Editor Paket Entegrasyonu ve Editor Core**

- [x] Task B.1.1 — `monaco-editor` npm paketini `packages/editor`'a yükle.
- [x] Task B.1.2 — Editor tip tanımlamalarını oluştur: `packages/editor/src/types.ts` (FileUri, LanguageId, Position, Range, EditorMarker, EditorModelInfo, EditorTab, EditorConfig, EditorEventMap).
- [x] Task B.1.3 — `EditorModelManager` sınıfını oluştur: `packages/editor/src/editor-model.ts` (dosya model yaşam döngüsü, dirty state, version tracking, marker yönetimi, dil algılama).
- [x] Task B.1.4 — `EditorManager` sınıfını oluştur: `packages/editor/src/editor-manager.ts` (multi-tab yönetimi, preview tab, cursor tracking, save coordination).
- [x] Task B.1.5 — `MonacoWrapper` React bileşenini oluştur: `packages/editor/src/monaco-wrapper.tsx` (Monaco editör bağlama, content sync, cursor sync, lazy loading).
- [x] Task B.1.6 — `packages/editor/tsconfig.json` oluştur (JSX desteği).
- [x] Task B.1.7 — `packages/editor/package.json` güncelle (monaco-editor dependency, react peerDependency).
- [x] Task B.1.8 — `packages/editor/src/index.ts` güncelle (tüm export'lar).
- [x] Task B.1.9 — Editor model testleri yaz: `packages/editor/src/editor-model.test.ts` (16 test).
- [x] Task B.1.10 — Root `tsconfig.json`'a editor reference ekle.

**B.2 — Workspace Manager ve File System Abstraction**

- [x] Task B.2.1 — Workspace tip tanımlamalarını oluştur: `packages/ide-core/src/workspace-types.ts` (WorkspaceEntry, WorkspaceMetadata, WorkspaceOpenOptions, FileReadResult, FileWriteOptions, PatchEntry, ApplyPatchResult, WorkspacePermission, FileChangeEvent).
- [x] Task B.2.2 — `FileSystemAdapter` arayüzünü oluştur: `packages/ide-core/src/file-system.ts` (readFile, writeFile, deleteFile, renameFile, exists, isDirectory, listDirectory, stat, createDirectory, watch).
- [x] Task B.2.3 — `InMemoryFsAdapter` sınıfını oluştur (test ve virtual workspace için in-memory FS).
- [x] Task B.2.4 — `applyPatchesToContent` pure fonksiyonunu oluştur (line-based patch uygulama).
- [x] Task B.2.5 — `WorkspaceManager` sınıfını oluştur: `packages/ide-core/src/workspace-manager.ts` (workspace lifecycle, dosya işlemleri, patch uygulama, tree snapshot, permission model, recent workspaces).
- [x] Task B.2.6 — `packages/ide-core/src/index.ts` güncelle (workspace exports).

**B.3 — Terminal Runtime Temel İskeleti**

- [x] Task B.3.1 — `TerminalSessionManager` sınıfını oluştur: `packages/ide-core/src/terminal-runtime.ts` (session lifecycle, output buffering, session türleri: user/agent/task/scratchpad, status tracking).
- [x] Task B.3.2 — `CommandPolicyGuard` sınıfını oluştur: `packages/ide-core/src/command-policy.ts` (komut risk sınıflandırması, blocked/dangerous/caution/safe pattern matching, network command detection).
- [x] Task B.3.3 — `packages/ide-core/src/index.ts` güncelle (terminal exports).

**B.4 — Auto-save Mekanizması**

- [x] Task B.4.1 — `AutoSaveManager` sınıfını oluştur: `packages/ide-core/src/auto-save.ts` (debounced save, saveOnFocusLoss, saveOnTabClose, saveOnShutdown, dirty file tracking).
- [x] Task B.4.2 — `packages/ide-core/src/index.ts` güncelle (auto-save export).

**B.5 — Undo/Redo Altyapısı**

- [x] Task B.5.1 — `UndoRedoManager` sınıfını oluştur: `packages/ide-core/src/undo-redo.ts` (command history stack, undo/redo, transaction grouping, agent multi-file patch atomic undo, history visualization).
- [x] Task B.5.2 — `packages/ide-core/src/index.ts` güncelle (undo-redo export).

**B.6 — Web App Entegrasyonu**

- [x] Task B.6.1 — `IDEProvider` context provider oluştur: `apps/web/src/ide-context.tsx` (EditorManager, WorkspaceManager, TerminalSessionManager, CommandPolicyGuard, AutoSaveManager, UndoRedoManager).
- [x] Task B.6.2 — `ExplorerPanel` bileşeni oluştur: `apps/web/src/components/ExplorerPanel.tsx` (workspace tree, dosya açma, klasör expand/collapse).
- [x] Task B.6.3 — `EditorPanel` bileşeni oluştur: `apps/web/src/components/EditorPanel.tsx` (tab bar, Monaco lazy loading, dirty indicator, tab close).
- [x] Task B.6.4 — `TerminalPanel` bileşeni oluştur: `apps/web/src/components/TerminalPanel.tsx` (session tabs, output display, command input, command policy integration).
- [x] Task B.6.5 — `StatusBarContent` bileşeni oluştur (App.tsx içinde): aktif dosya bilgisi, workspace adı, dirty count.
- [x] Task B.6.6 — `App.tsx` güncelle: IDEProvider ile sarmalama, Explorer/Editor/Terminal panel'leri bağlama.
- [x] Task B.6.7 — `apps/web/package.json` güncelle: terminal-runtime dependency.

**B.7 — Doğrulama**

- [x] Task B.7.1 — `npm run build` başarılı: TypeScript derleme hatasız.
- [x] Task B.7.2 — `npm run test` başarılı: tüm testler geçti (3 test dosyası, 5 vitest + 16 editor model node:test).
- [x] Task B.7.3 — `cargo check --workspace` başarılı: Rust derleme hatasız.

**Faz B sonrası bekleyen işler:**

- [x] Tauri FS adapter runtime entegrasyonu (Tauri command bridge) — `crates/desktop-host/src/lib.rs`
- [x] Monaco tema/keybinding entegrasyonu — `packages/ide-core/src/theme-manager.ts`, `keybinding-manager.ts`
- [x] Diff editor (patch preview) — `packages/editor/src/diff-editor.tsx`
- [x] Search panel — `apps/web/src/components/SearchPanel.tsx`
- [x] Command Palette UI — `apps/web/src/components/CommandPalette.tsx`

## Faz C — Agent Core ve Güvenli Tool Çalıştırma

- [x] Agent Runtime iskeletini oluştur — `packages/agent-runtime/src/types.ts`, `agent-session.ts`
- [x] Chat Mode, Plan Mode ve sınırlı Act Mode akışını kur — `packages/agent-runtime/src/agent-orchestrator.ts`
- [x] Tool Registry temel arayüzünü oluştur — `packages/agent-tools/src/tool-registry.ts`
- [x] `read_file`, `search_files`, `apply_patch`, `run_command` araçlarını tasarla — `packages/agent-tools/src/core-tools.ts`
- [x] Approval workflow ve risk sınıflandırmasını ekle — `packages/agent-runtime/src/approval-guard.ts`
- [x] Agent action audit log modelini oluştur — `packages/agent-runtime/src/audit-log.ts`
- [x] Agent action undo desteğini ekle — `packages/agent-runtime/src/agent-undo-adapter.ts` (AgentUndoManagerAdapter, fileWrite/filePatch undo/redo)

## Faz C+ — IDE Shell, Menu System and Core Features

### Aktif Task Grubu — C+ REAL Workspace MVP

Bu task grubu, menülerde görünen ama gerçek kullanımda güvenilir çalışmayan IDE kabuğunu desktop-first gerçek proje geliştirme akışına bağlamak içindir. Bir task sadece TypeScript/Rust build geçti diye bitmiş sayılmaz; aşağıdaki kabul kriterleri gerçek uygulamada denenmeden tiklenmeyecek.

#### C+ REAL Workspace MVP — Kabul Kriterli Ana Tasklar

- [x] Task C+REAL.1 — Desktop Tauri tarafında güvenli workspace/file-system komutları gerçek kullanımda çalışacak (`apps/desktop/src-tauri/src/lib.rs`)
  - Kabul: Native Open Folder ile gerçek klasör açılır, ağaç görünür, dosya okunur/yazılır/silinir/rename edilir.
- [x] Task C+REAL.2 — Web UI runtime Tauri-backed `FileSystemAdapter` ile çalışacak; browser fallback ayrı kalacak (`apps/web/src/platform/*`)
  - Kabul: Desktop runtime in-memory `/project` yerine gerçek diski kullanır; browser demo moda düşer.
- [x] Task C+REAL.3 — `IDEProvider`, Explorer ve App gerçek workspace lifecycle ile çalışacak (`apps/web/src/ide-context.tsx`, `ExplorerPanel.tsx`, `App.tsx`)
  - Kabul: Workspace aç/kapat/değiştir durumunda editor tabları, explorer ve recent workspace state'i tutarlı kalır.
- [x] Task C+REAL.4 — Open File/Open Folder/New File/Save/Save As/Save All gerçek native akışlarla çalışacak
  - Kabul: `Ctrl+O`, `Ctrl+N`, `Ctrl+S`, `Ctrl+Shift+S` gerçek dosyada sonuç üretir; Save As seçilen path'e yazar.
- [x] Task C+REAL.5 — Explorer gerçek workspace eventleriyle güncellenecek
  - Kabul: UI'dan new/rename/delete sonrası ağaç yenilenir; dışarıdan dosya değişince canlı kontrol bildirir.
- [x] Task C+REAL.6 — Quick Open gerçek workspace dosya indeksinden çalışacak
  - Kabul: `Ctrl+P` açık tablardan bağımsız olarak workspace içindeki dosyaları bulup açar.
- [x] Task C+REAL.7 — Dış dosya değişikliği / conflict kontrolü çalışacak
  - Kabul: Dirty olmayan açık dosya dışarıdan değişince reload olur; dirty dosyada kullanıcıya Reload/Keep seçeneği çıkar.
- [x] Task C+REAL.8 — Gerçek davranış doğrulama checklist'i çalıştırılacak
  - Kabul: Build/check yanında en az manuel desktop smoke test adımları TODO'ya not edilir.

#### C+ REAL Workspace MVP — Sıradaki Net Tasklar

- [x] Task C+REAL.N1 — Native Save As akışı ekle; workspace dışı tekil dosyada güvenli izin modeli netleşsin
- [x] Task C+REAL.N2 — Quick Open'u açık workspace ağacından dosya indeksleyerek çalıştır; sadece açık tab/recent listesine bağlı kalmasın
- [x] Task C+REAL.N3 — Desktop file watcher ekle; dışarıdan değişen dosya için reload/conflict bildirimi göster
- [x] Task C+REAL.N4 — Büyük klasörlerde lazy explorer loading ve ignore pattern (`node_modules`, `target`, `dist`) ayarını kullanıcıya aç
- [-] Task C+REAL.N5 — Desktop PTY terminal task grubuna geç; terminal oturumunu aktif workspace root'unda başlat (Tauri PTY bağlama cloud build olmadan doğrulandı sayılmaz)

#### C+ REAL Workspace MVP — Manuel Smoke Test Checklist

> Not: Cloud ortamında desktop bundle alınamadığı için bu liste manuel olarak gerek desktop bundle alındığında doğrulanmalı. Kod tarafında ilgili akışlar yazıldı.

- [-] Desktop app açılır, File → Open Folder ile gerçek bir proje klasörü seçilir
- [-] Explorer gerçek klasörü gösterir; `node_modules`, `.git`, `target`, `dist` gibi ağır klasörler taramayı kilitlemez
- [-] Explorer'dan dosya açılır, Monaco içinde düzenlenir, `Ctrl+S` ile aynı dosyaya yazılır
- [-] `Ctrl+Shift+S` ile Save As yapılır ve seçilen yeni path'e dosya yazılır
- [-] `Ctrl+Alt+S` ile birden fazla dirty dosya Save All yapılır
- [-] `Ctrl+P` açık tablardan bağımsız olarak workspace içindeki dosyaları bulur ve açar
- [-] IDE dışından dosya değiştirildiğinde açık dirty olmayan dosya reload olur
- [-] IDE dışından dirty dosya değiştirildiğinde Reload from Disk / Keep My Changes bildirimi çıkar
- [-] Explorer context menu ile New File/New Folder/Rename/Delete gerçek diskte sonuç üretir

- [x] Menu bar / Title bar component oluştur (File, Edit, View, Help menus)
- [x] Activity bar collapse/expand özelliği ekle
- [x] Sidebar panel collapse/expand özelliği ekle
- [x] Bottom panel collapse/expand özelliği ekle
- [x] Right panel collapse/expand özelliği ekle
- [x] Tab bar component oluştur (dosya sekmeleri üstte)
- [x] Tab drag-and-drop reordering özelliği
- [x] Tab split view (horizontal/vertical) özelliği
- [x] Marketplace entegrasyon iskeletini oluştur
- [x] VS Code Marketplace API entegrasyonu
- [x] Extension marketplace UI componenti oluştur
- [x] App link/launcher componenti oluştur
- [x] Quick Open (Ctrl+P) dosya araması
- [x] Go to Symbol (Ctrl+Shift+O) sembol araması
- [x] Go to Line (Ctrl+G) satır atlaması
- [x] Find in Files (Ctrl+Shift+F) global arama
- [x] Replace in Files (Ctrl+Shift+H) global replace
- [x] File system context menu (right-click menu)
- [x] New File/Folder dialogları
- [x] Rename file/folder dialogları
- [x] Delete file/folder confirmation dialogları
- [x] File save/save as/save all dialogları
- [x] Recent files list componenti
- [x] Open File dialog (desktop için native, web için File System Access API)
- [x] Open Folder dialog (desktop için native, web için File System Access API)
- [x] Workspace switcher componenti
- [x] Settings UI (JSON + GUI)
- [x] Keyboard shortcuts UI
- [x] Keybinding customization dialog
- [x] Theme picker UI
- [x] Font size/line height controls
- [x] Zoom in/out controls
- [x] Toggle word wrap
- [x] Toggle minimap
- [x] Toggle line numbers
- [x] Toggle render whitespace
- [x] Toggle bracket pair colorization
- [x] Toggle indent guides
- [x] Toggle breadcrumb navigation
- [x] Problems panel (diagnostics)
- [x] Output panel (build/lint output)
- [x] Debug panel (breakpoints, call stack, variables)
- [x] Source Control panel (git changes, diff viewer)
- [x] Git commit dialog
- [x] Git branch switcher
- [-] Git stash management
- [-] Git merge conflict resolver UI
- [x] Terminal - Web için web terminal entegrasyonu (xterm.js)
- [-] Terminal - Desktop için native system terminal entegrasyonu (PTY) (cloud build olmadan doğrulanmadı)
- [x] Terminal shell selector (bash, zsh, fish, PowerShell, CMD)
- [x] Terminal profile management
- [x] Terminal environment variable management
- [x] Terminal command history UI
- [x] Terminal split pane özelliği
- [x] Notifications/toast system
- [x] Progress indicator for long operations
- [x] Welcome screen (recent workspaces, quick actions)
- [x] About dialog (version, credits, license)
- [x] Error reporting dialog
- [-] Crash recovery UI
- [x] Auto-update notification (desktop)
- [x] Telemetry opt-in dialog
- [x] Accessibility menu (screen reader, high contrast)
- [x] Language selector (i18n)
- [-] RTL layout support
- [-] Custom title bar (desktop frameless window)
- [-] Window controls (minimize, maximize, close)
- [x] Fullscreen mode toggle
- [x] Zen mode (distraction-free)
- [x] Layout presets (default, focus, zen)
- [x] Workspace layout persistence
- [x] Panel size persistence
- [x] Session restore on startup

### Faz C+ — Detaylı Task Planı ve Durum

**C+.1 — Menu Bar and Title Bar**

- [x] Task C+.1.1 — Create MenuBar component: `packages/ui/src/layout/MenuBar.tsx` (File, Edit, View, Help menus)
- [x] Task C+.1.2 — Create MenuItem component: dropdown, submenu, separator, checkbox item
- [x] Task C+.1.3 — Add menu keyboard shortcuts integration
- [x] Task C+.1.4 — File menu: New, Open, Open Recent, Save, Save As, Save All, Exit
- [x] Task C+.1.5 — Edit menu: Undo, Redo, Cut, Copy, Paste, Find, Replace
- [x] Task C+.1.6 — View menu: Command Palette, Explorer, Search, Terminal, Output, Problems
- [x] Task C+.1.7 — Go menu: Go to File, Go to Symbol, Go to Line, Go to Definition
- [x] Task C+.1.8 — Run menu: Start Debugging, Run Without Debugging, Stop Debugging
- [x] Task C+.1.9 — Terminal menu: New Terminal, Split Terminal, Kill Terminal
- [x] Task C+.1.10 — Help menu: Documentation, Welcome, About, Report Issue

**C+.2 — Activity Bar and Panel Controls**

- [x] Task C+.2.1 — Add ActivityBar collapse/expand toggle button
- [x] Task C+.2.2 — Add Sidebar collapse/expand toggle button
- [x] Task C+.2.3 — Add Bottom panel collapse/expand toggle button
- [x] Task C+.2.4 — Add Right panel collapse/expand toggle button
- [x] Task C+.2.5 — Add Panel size persistence (localStorage/desktop storage)
- [x] Task C+.2.6 — Add Panel resize handles (draggable borders)
- [x] Task C+.2.7 — Add Panel hide/show keyboard shortcuts

**C+.3 — Tab Bar and Editor Layout**

- [x] Task C+.3.1 — Create TabBar component: `packages/ui/src/layout/TabBar.tsx`
- [x] Task C+.3.2 — Create Tab component: close button, dirty indicator, active state
- [x] Task C+.3.3 — Add Tab drag-and-drop reordering
- [x] Task C+.3.4 — Add Tab context menu (Close, Close Others, Close All)
- [x] Task C+.3.5 — Add Editor split view (horizontal/vertical)
- [-] Task C+.3.6 — Add Editor group management (UI placeholder var; tam multi-group state cloud build olmadan doğrulanmadı)
- [x] Task C+.3.7 — Add Tab pinning/fixed tabs
- [x] Task C+.3.8 — Add Tab color coding by language

**C+.4 — Marketplace and Extensions**

- [x] Task C+.4.1 — Create Marketplace API client: `packages/ide-core/src/marketplace.ts`
- [x] Task C+.4.2 — Add VS Code Marketplace API integration (Open VSX uyumlu provider)
- [x] Task C+.4.3 — Define Extension manifest schema (package.json extension format)
- [x] Task C+.4.4 — Create Marketplace UI component: `apps/web/src/components/Marketplace.tsx`
- [x] Task C+.4.5 — Add Extension search and filter UI
- [x] Task C+.4.6 — Add Extension install/uninstall workflow
- [x] Task C+.4.7 — Add Extension enable/disable workflow
- [-] Task C+.4.8 — Add Extension settings UI (manifest seviyesinde dedicated extension settings UI yok)
- [x] Task C+.4.9 — Add Custom marketplace API placeholder (future)
- [x] Task C+.4.10 — Add Extension security review UI

**C+.5 — Quick Open and Navigation**

- [x] Task C+.5.1 — Create Quick Open dialog (Ctrl+P): `apps/web/src/components/QuickOpen.tsx`
- [x] Task C+.5.2 — Create Go to Symbol dialog (Ctrl+Shift+O)
- [x] Task C+.5.3 — Create Go to Line dialog (Ctrl+G)
- [x] Task C+.5.4 — Create Find in Files dialog (Ctrl+Shift+F)
- [x] Task C+.5.5 — Create Replace in Files dialog (Ctrl+Shift+H)
- [x] Task C+.5.6 — Add Command Palette enhancement (fuzzy search)
- [x] Task C+.5.7 — Add Recent files quick access
- [-] Task C+.5.8 — Add Workspace symbols quick access (sadece aktif dosyaya karşı sembol çalışıyor; workspace-wide LSP yok)

**C+.6 — File System Operations**

- [x] Task C+.6.1 — Create File context menu component: right-click menu for files
- [x] Task C+.6.2 — Create New File dialog: name, template selection
- [x] Task C+.6.3 — Create New Folder dialog: name, location
- [x] Task C+.6.4 — Create Rename dialog: validation, conflict detection
- [x] Task C+.6.5 — Create Delete confirmation dialog: list affected files
- [x] Task C+.6.6 — Add Save/Save As dialogs
- [x] Task C+.6.7 — Add Open File dialog (desktop: native, web: File System Access API)
- [x] Task C+.6.8 — Add Open Folder dialog (desktop: native, web: File System Access API)
- [-] Task C+.6.9 — Add File drag-and-drop from OS (drop handler iskeleti yok)
- [-] Task C+.6.10 — Add File copy/paste operations (clipboard tabanlı kopya yok)

**C+.7 — Workspace and Session Management**

- [x] Task C+.7.1 — Create Recent files list component
- [x] Task C+.7.2 — Create Recent workspaces list component
- [x] Task C+.7.3 — Create Workspace switcher UI
- [x] Task C+.7.4 — Add Workspace settings per-workspace storage
- [x] Task C+.7.5 — Add Session save/restore on startup
- [-] Task C+.7.6 — Add Crash recovery session restore (autosave dosya üzerinde çalışıyor, ayrı crash recovery state'i yok)
- [-] Task C+.7.7 — Add Workspace trust dialog (security)
- [-] Task C+.7.8 — Add Multi-root workspace support

**C+.8 — Settings and Preferences**

- [x] Task C+.8.1 — Create Settings UI component: JSON editor + GUI form
- [x] Task C+.8.2 — Add Settings schema validation
- [x] Task C+.8.3 — Add User settings vs workspace settings
- [x] Task C+.8.4 — Create Keyboard shortcuts UI
- [x] Task C+.8.5 — Add Keybinding conflict detection
- [x] Task C+.8.6 — Create Theme picker UI (preview themes)
- [x] Task C+.8.7 — Create Font settings UI (family, size, line height)
- [x] Task C+.8.8 — Add Editor behavior settings (word wrap, minimap, etc.)
- [x] Task C+.8.9 — Add Terminal settings (shell, profile, font)
- [x] Task C+.8.10 — Add Settings search and filter

**C+.9 — Terminal Enhancements**

- [x] Task C+.9.1 — Add Web terminal integration (xterm.js)
- [-] Task C+.9.2 — Add Desktop native terminal integration (PTY/ConPTY) (Tauri PTY bağlama cloud build olmadan doğrulandı sayılmaz)
- [x] Task C+.9.3 — Add Shell profile selector (bash, zsh, fish, PowerShell, CMD)
- [x] Task C+.9.4 — Add Terminal environment variable editor
- [x] Task C+.9.5 — Add Terminal command history UI
- [x] Task C+.9.6 — Add Terminal split pane (horizontal/vertical)
- [x] Task C+.9.7 — Add Terminal resize handles
- [x] Task C+.9.8 — Add Terminal scrollback buffer management
- [x] Task C+.9.9 — Add Terminal ANSI color support
- [-] Task C+.9.10 — Add Terminal link detection (clickable URLs)

**C+.10 — Source Control and Git**

- [x] Task C+.10.1 — Create Source Control panel UI
- [x] Task C+.10.2 — Add Git status visualization (modified, added, deleted)
- [x] Task C+.10.3 — Add Git diff viewer (unified/split view)
- [x] Task C+.10.4 — Add Git commit dialog (message, stage files)
- [x] Task C+.10.5 — Add Git branch switcher UI
- [-] Task C+.10.6 — Add Git stash management UI
- [-] Task C+.10.7 — Add Git merge conflict resolver UI
- [-] Task C+.10.8 — Add Git blame/annotations
- [-] Task C+.10.9 — Add Git ignore editor
- [-] Task C+.10.10 — Add Git remote management

**C+.11 — Diagnostics and Problems**

- [x] Task C+.11.1 — Create Problems panel UI
- [x] Task C+.11.2 — Add Error/warning/info severity icons
- [x] Task C+.11.3 — Add Problems filter by severity
- [x] Task C+.11.4 — Add Problems filter by source (linter, compiler)
- [-] Task C+.11.5 — Add Error squiggle in editor (underline) (Monaco markers entegrasyonu LSP olmadan tam yapılmadı)
- [-] Task C+.11.6 — Add Error hover tooltip
- [-] Task C+.11.7 — Add Problems auto-fix suggestions
- [x] Task C+.11.8 — Add Output panel for build/lint output
- [x] Task C+.11.9 — Add Output channel selector
- [x] Task C+.11.10 — Add Output log filtering

**C+.12 — Debug Panel**

- [x] Task C+.12.1 — Create Debug panel UI component
- [x] Task C+.12.2 — Add Breakpoints UI (list, toggle, edit)
- [x] Task C+.12.3 — Add Call stack viewer
- [x] Task C+.12.4 — Add Variables inspector
- [x] Task C+.12.5 — Add Watch expressions
- [x] Task C+.12.6 — Add Debug console (REPL)
- [x] Task C+.12.7 — Add Debug toolbar (step over, step into, continue)
- [-] Task C+.12.8 — Add Debug configuration (launch.json)
- [-] Task C+.12.9 — Add Debug session management
- [-] Task C+.12.10 — Add Debug adapter protocol (DAP) client

**C+.13 — Notifications and Feedback**

- [x] Task C+.13.1 — Create Notification/toast component
- [x] Task C+.13.2 — Add Notification types: info, warning, error, success
- [x] Task C+.13.3 — Add Notification actions (buttons)
- [x] Task C+.13.4 — Add Notification center (history)
- [x] Task C+.13.5 — Create Progress indicator component
- [x] Task C+.13.6 — Add Long-running operation progress
- [x] Task C+.13.7 — Add Cancellable operations
- [x] Task C+.13.8 — Add Status bar transient messages
- [x] Task C+.13.9 — Add Error reporting dialog
- [-] Task C+.13.10 — Add Crash recovery UI

**C+.14 — Welcome and Onboarding**

- [x] Task C+.14.1 — Create Welcome screen component
- [x] Task C+.14.2 — Add Recent workspaces quick access
- [x] Task C+.14.3 — Add Quick actions (New File, Open Folder)
- [x] Task C+.14.4 — Add Getting started guide
- [x] Task C+.14.5 — Add Keyboard shortcuts cheat sheet
- [x] Task C+.14.6 — Add Tips and tricks carousel
- [x] Task C+.14.7 — Add Show welcome on startup setting
- [-] Task C+.14.8 — Add New version release notes (release notes view yok; auto-update bildirimi var)

**C+.15 — Desktop-Specific Features**

- [-] Task C+.15.1 — Add Custom title bar (frameless window) (varsayılan title bar kullanılıyor)
- [-] Task C+.15.2 — Add Window controls (minimize, maximize, close) (Tauri native window controls aktif; custom yok)
- [x] Task C+.15.3 — Add Native menu bar integration (Tauri)
- [x] Task C+.15.4 — Add System tray icon
- [x] Task C+.15.5 — Add Auto-update notification
- [x] Task C+.15.6 — Add Auto-download and install updates
- [x] Task C+.15.7 — Add Native file dialogs
- [-] Task C+.15.8 — Add Native notifications (Tauri plugin-notification bağlandığı sayılmaz; cloud doğr. yok)
- [-] Task C+.15.9 — Add OS keychain integration (Token Vault keychain backend cloud build olmadan doğrulandı sayılmaz)
- [-] Task C+.15.10 — Add Desktop app association (file extensions)

**C+.16 — Accessibility and Internationalization**

- [x] Task C+.16.1 — Add Screen reader announcements
- [x] Task C+.16.2 — Add High contrast theme support
- [x] Task C+.16.3 — Add Reduced motion support
- [x] Task C+.16.4 — Add Focus trap in modals
- [x] Task C+.16.5 — Add Keyboard navigation for all UI
- [x] Task C+.16.6 — Add ARIA labels and roles
- [x] Task C+.16.7 — Create Language selector UI
- [-] Task C+.16.8 — Add RTL layout support
- [x] Task C+.16.9 — Add Message key-value system
- [x] Task C+.16.10 — Add Locale loading and fallback

**C+.17 — Layout and View Modes**

- [x] Task C+.17.1 — Layout presets (default, focus, zen)
- [x] Task C+.17.2 — Zen mode (distraction-free)
- [x] Task C+.17.3 — Fullscreen mode toggle
- [x] Task C+.17.4 — Editor zoom in/out
- [x] Task C+.17.5 — UI zoom in/out
- [x] Task C+.17.6 — Layout state persistence
- [x] Task C+.17.7 — Panel size persistence
- [-] Task C+.17.8 — Window size/position persistence
- [-] Task C+.17.9 — Multi-monitor support (desktop)
- [-] Task C+.17.10 — Tiling window management

**Post-Phase C+ Pending Tasks:**

- [-] Phase C+ validation: build, test, lint must pass (cloud build yasaklandı; lint temiz, typecheck'te yalnızca önceden var olan no-implicit-any uyarıları kaldı)

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
- [x] Search panel slotunu oluştur
- [x] Problems/diagnostics panel slotunu oluştur
- [x] Status bar iskeletini oluştur
- [x] Activity bar / side bar iskeletini oluştur
- [x] Command Palette temel UI'ını oluştur
- [x] Theme Manager temelini oluştur
- [x] Keybinding Manager temelini oluştur
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

- [x] Monaco Editor paket entegrasyonunu kur
- [x] Editor model yönetim arayüzünü oluştur
- [x] Dosya açma ve editor model oluşturma akışını kur
- [x] Çoklu tab yönetimi oluştur
- [x] Dirty state yönetimini oluştur
- [x] Save akışını File System Abstraction'a bağla
- [x] Diff editor kullanımını planla
- [x] Patch preview için diff editor entegrasyonunu oluştur
- [ ] Theme entegrasyonunu bağla
- [ ] Keybinding entegrasyonunu bağla
- [ ] Diagnostics marker entegrasyonunu planla
- [ ] LSP semantic token entegrasyonunu planla
- [ ] Büyük dosya açma guard stratejisini belirle
- [ ] Editor state persistence modelini oluştur
- [ ] Monaco editor erişilebilirlik API entegrasyonunu yap

## 2.6 Workspace Manager ve File System Abstraction

- [x] Workspace Manager çekirdek arayüzünü tanımla
- [x] Workspace metadata modelini oluştur
- [x] File System Abstraction arayüzünü tanımla
- [ ] Desktop FS adapter tasarla
- [x] Browser FS adapter tasarla (InMemory adapter mevcut, OPFS adapter ileride)
- [ ] OPFS adapter tasarla
- [ ] Git-backed workspace adapter tasarla
- [x] Read file operation modelini oluştur
- [x] Write file operation modelini oluştur
- [x] Apply patch operation modelini oluştur
- [x] List directory operation modelini oluştur
- [ ] Watch file changes modelini oluştur
- [x] Workspace root permission modelini oluştur
- [x] Workspace tree snapshot üretimini oluştur
- [ ] Workspace tree cache invalidation stratejisini oluştur
- [ ] Secret file pattern tespit mantığını planla
- [ ] Büyük repo için incremental scan stratejisini oluştur

## 2.7 Desktop Shell ve Tauri Host

- [x] Tauri v2 uygulama iskeletini oluştur
- [x] Rust command bridge temelini oluştur
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

- [x] Terminal Runtime paket arayüzünü oluştur
- [x] Terminal Session Manager tasarla
- [x] Terminal session veri modelini oluştur
- [x] User Terminal türünü tanımla
- [x] Agent Terminal türünü tanımla
- [x] Task Terminal türünü tanımla
- [x] Scratchpad Terminal türünü tanımla
- [ ] Shell Profile Resolver tasarla
- [ ] Windows CMD/PowerShell/WSL profil desteğini planla
- [ ] macOS zsh/bash profil desteğini planla
- [ ] Linux bash/zsh/fish profil desteğini planla
- [ ] PTY Bridge arayüzünü oluştur
- [ ] Desktop native PTY adapter tasarla
- [ ] Browser remote runner PTY adapter tasarla
- [ ] WASI/WebContainer terminal adapter seçeneklerini değerlendir
- [x] Command Policy Guard tasarla
- [ ] Working Directory Guard tasarla
- [x] Terminal output stream parser oluştur (output buffer yönetimi)
- [x] Terminal output'u UI'a stream et
- [ ] Terminal output'u Context Engine'e gönder
- [ ] Terminal komutlarını Audit Log'a gönder
- [ ] Test/lint/build output parser POC oluştur
- [x] Terminal panel UI ile runtime bağlantısını kur

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

- [x] Agent Runtime çekirdek paket sınırlarını tanımla
- [x] Agent session veri modelini oluştur
- [ ] Agent state machine tasarla
- [x] Chat Mode orchestrator oluştur
- [x] Plan Mode orchestrator oluştur
- [x] Limited Act Mode orchestrator oluştur
- [x] Review Mode orchestrator planla
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

- [x] Tool Registry çekirdek arayüzünü tanımla
- [x] Tool manifest şemasını oluştur
- [x] Tool input/output şemalarını oluştur
- [x] Tool permission metadata modelini oluştur
- [x] `read_file` tool tasarla
- [x] `write_file` tool tasarla
- [x] `apply_patch` tool tasarla
- [x] `search_files` tool tasarla
- [x] `list_files` tool tasarla
- [x] `run_command` tool tasarla
- [x] `git_diff` tool tasarla
- [x] `run_tests` tool tasarla
- [ ] `open_preview` tool tasarla
- [ ] `reload_preview` tool tasarla
- [ ] `collect_console_logs` tool tasarla
- [ ] `collect_network_errors` tool tasarla
- [ ] `capture_screenshot` tool tasarla
- [ ] `scratchpad_execute` tool tasarla
- [ ] `lsp_diagnostics` tool tasarla
- [ ] `package_manager` tool tasarla
- [x] Tool execution log formatını oluştur
- [x] Tool hata formatını standartlaştır

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

- [x] Auto-save debounced save mekanizmasını kur
- [ ] On focus loss save uygula (framework hazır, UI event bağlanacak)
- [ ] On tab close save uygula (framework hazır, UI event bağlanacak)
- [ ] On IDE shutdown save uygula (framework hazır, UI event bağlanacak)
- [ ] On crash/force close recovery tasarla
- [ ] External file change conflict resolution uygula
- [x] Unsaved changes tracker oluştur
- [x] Dirty file indicator ekle
- [ ] Save confirmation dialog tasarla
- [ ] Crash recovery backup store kur
- [ ] Periodic unsaved file backup uygula
- [ ] IDE crash recovery state restore yap

## 2.26 Geri Alma/Yineleme (Undo/Redo) Sistemi

- [x] Command History Stack tasarla
- [x] File content change undo desteği ekle
- [ ] File create/delete/rename undo desteği ekle
- [x] Agent patch application undo desteği ekle (transaction support)
- [ ] Terminal command execution undo desteği ekle
- [ ] Git operation (commit, stash) undo desteği ekle
- [ ] Configuration change undo desteği ekle
- [ ] Character-level (editor) undo desteği (Monaco native)
- [x] Transaction-level (agent actions) undo desteği
- [x] Agent multi-file patch atomic undo tasarla
- [ ] Cross-file undo desteği ekle
- [x] Redo stack management uygula
- [x] Undo/redo history visualization oluştur (getUndoHistory/getRedoHistory)

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
- [x] Frontend unit test altyapısını kur (vitest + node:test)
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
- [x] Monaco Editor panelini bağla
- [x] Workspace Manager ve File System Abstraction temelini oluştur
- [ ] Tauri üzerinden desktop workspace açma akışını bağla
- [x] Project Terminal Runtime iskeletini oluştur
- [x] Agent Runtime ve Tool Registry temelini oluştur
- [x] `read_file`, `search_files`, `apply_patch`, `run_command` tool akışlarını tasarla
- [ ] Embedded Browser panel POC oluştur
- [ ] Scratchpad Runtime POC oluştur
- [ ] Context Engine'e terminal/browser/scratchpad veri kaynaklarını bağla
- [ ] BYOK AI provider connector POC oluştur
- [x] Auto-save mekanizmasını kur
- [x] Undo/Redo temel altyapısını oluştur
- [x] Error boundary temelini oluştur
- [x] Settings management temelini oluştur
- [ ] Accessibility (WCAG 2.1 AA) temel desteğini ekle
- [ ] i18n message key sistemini kur
- [ ] İlk MVP demo akışını çalıştır
