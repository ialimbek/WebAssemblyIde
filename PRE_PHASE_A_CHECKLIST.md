# Pre-Phase A Checklist — Faz A Öncesi Tamamlanması Gerekenler

Bu dosya, Faz A'ya (proje koduna geçiş) başlamadan önce tamamlanması gereken tüm altyapı işlerini takip eder.

Oluşturulma: 2026-05-21
Tamamlanma: 2026-05-21

---

## Task 1: Root Build Sistemi ve Lint/Format Altyapısı

**Durum:** ✅ Tamamlandı
**Yapılanlar:**

- Root `package.json` script'leri çalışır hale getirildi (`dev`, `build`, `lint`, `test`, `clean`)
- ESLint v10 + typescript-eslint kuruldu ve `eslint.config.mjs` oluşturuldu
- `workspace:*` protokolü npm uyumlu `*` formatına dönüştürüldü (24 dosya)
- `rimraf` clean script için eklendi
- `.gitignore` güncellendi (tsbuildinfo, package-lock.json notu)

---

## Task 2: Test Framework Kurulumu

**Durum:** ✅ Tamamlandı
**Yapılanlar:**

- Vitest v4.1.7 kuruldu
- `vitest.config.ts` oluşturuldu
- Root `test` script `vitest run` olarak güncellendi
- `packages/shared/src/shared.test.ts` placeholder testi oluşturuldu
- Test sonucu: 1 passed ✅

---

## Task 3: packages/shared — Paylaşılan Tipler ve Utiliteler

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Tüm export'lar
- `src/types/common.ts` — DeepPartial, Nullable, Optional, AsyncResult, Callback
- `src/types/events.ts` — EventMap, EventHandler, Disposable, EventEmitter
- `src/types/commands.ts` — CommandDefinition, CommandHandler
- `src/types/result.ts` — Result, Success, Failure, ok(), err()
- `src/constants/app.ts` — APP_NAME, APP_VERSION
- `src/constants/commands.ts` — EditorCommandIds, WorkspaceCommandIds, TerminalCommandIds, AgentCommandIds
- `src/constants/events.ts` — EventNames (20 event)
- `src/constants/permissions.ts` — PermissionLevel, RiskLevel, RiskLevelMap
- `src/utils/timing.ts` — debounce, throttle
- `src/utils/id.ts` — generateId, shortId
- `src/utils/assert.ts` — invariant, assertNever
- `src/utils/object.ts` — deepClone, deepMerge
- `src/utils/logger.ts` — createLogger, Logger, LogLevel
- `tsconfig.json` — extends root tsconfig

---

## Task 4: packages/ui — Temel UI Bileşenleri

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Tüm export'lar
- `src/layout/AppShell.tsx` — Ana shell layout (sidebar + editor + bottom panel + status bar)
- `src/layout/Panel.tsx` — Genel panel bileşeni (title bar + content)
- `src/layout/Sidebar.tsx` — Sidebar bileşeni
- `src/layout/StatusBar.tsx` — Status bar bileşeni
- `src/layout/BottomPanel.tsx` — Alt panel (tab bar + content)
- `src/common/Button.tsx` — Button (primary/secondary/ghost/danger variants)
- `src/common/ErrorBoundary.tsx` — React Error Boundary
- `tsconfig.json` — JSX desteği ile
- React 19 bağımlılıkları eklendi

---

## Task 5: packages/command-bus — Command Bus + Event Bus

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Export'lar
- `src/command-bus.ts` — Command Bus (register, execute, has, getRegisteredCommands, dispose)
- `src/event-bus.ts` — Event Bus (on, once, off, emit, getEventNames, dispose)
- `tsconfig.json`

---

## Task 6: packages/performance-core — Startup Profiler Skeleton

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Export'lar
- `src/startup-profiler.ts` — StartupProfiler (start, end, getTotalTime, getMetrics, getMetricsByPhase, reset)
- `src/lazy-module-registry.ts` — LazyModuleRegistry (register, get, has, getState, dispose)
- `tsconfig.json`

---

## Task 7: packages/settings — Settings Management Temeli

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Export'lar
- `src/settings-manager.ts` — SettingsManager (register, get, set, reset, getAll, onChange, dispose). Hierarchy: default → workspace → user → project
- `tsconfig.json`

---

## Task 8: packages/notifications — Notification System Temeli

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Export'lar
- `src/notification-manager.ts` — NotificationManager (notify, info, warn, error, success, dismiss, getActive, clear, dispose)
- `tsconfig.json`

---

## Task 9: packages/ide-core — Panel Registry + Layout Manager

**Durum:** ✅ Tamamlandı
**Oluşturulan dosyalar:**

- `src/index.ts` — Export'lar
- `src/panel-registry.ts` — PanelRegistry (register, toggle, show, hide, getState, getPanelsBySlot, onChange, dispose)
- `src/layout-manager.ts` — LayoutManager (setSidebarWidth, setBottomPanelHeight, toggleSidebar, toggleBottomPanel, setRegionVisible, onChange, dispose)
- `tsconfig.json`

---

## Task 10: apps/web — Vite + React + TypeScript Web App Skeleton

**Durum:** ✅ Tamamlandı
**Yapılanlar:**

- `package.json` — Tüm workspace bağımlılıkları ile güncellendi
- `vite.config.ts` — Vite + React plugin + alias
- `tsconfig.json` — JSX react-jsx desteği
- `index.html` — Root div + CSS reset
- `src/main.tsx` — React 19 createRoot entry point
- `src/App.tsx` — IDE shell layout (AppShell, StatusBar, ErrorBoundary)
- Vite build başarılı: 52 modül, 865ms, 197KB output ✅

---

## Task 11: apps/web — App Shell Layout

**Durum:** ✅ Tamamlandı (Task 10 ile birlikte)
**Açıklama:** App.tsx içinde AppShell bileşeni sidebar + editor + bottom panel + status bar ile render edildi.

---

## Task 12: apps/desktop — Tauri v2 Desktop App Skeleton

**Durum:** ✅ Tamamlandı
**Yapılanlar:**

- `package.json` — Tauri API/CLI bağımlılıkları ile güncellendi
- `tsconfig.json` — JSX react-jsx desteği
- `src/index.tsx` — React 19 createRoot entry point
- `src/App.tsx` — IDE shell layout (web ile aynı yapı)
- Rust 1.95.0 + Cargo 1.95.0 kuruldu
- `tauri init` ile `src-tauri/` klasörü oluşturuldu:
  - `src/main.rs` — Windows subsystem, app_lib::run() entry
  - `src/lib.rs` — Tauri builder + log plugin
  - `Cargo.toml` — tauri v2.11.2, serde, serde_json, log bağımlılıkları
  - `tauri.conf.json` — 1280x800 pencere, WebAssemblyIde identifier
  - `capabilities/`, `icons/`, `build.rs` oluşturuldu

---

## Task 13: Error Boundary Temeli

**Durum:** ✅ Tamamlandı (Task 4 ile birlikte)
**Açıklama:** `packages/ui/src/common/ErrorBoundary.tsx` oluşturuldu. Application-level ve Panel-level kullanılabilir.

---

## Task 14: Workspace Dependency Resolution ve Cross-Package Build

**Durum:** ✅ Tamamlandı
**Doğrulama:**

- `npm install` başarılı — 391 paket
- packages/shared: `tsc --noEmit` ✅
- packages/command-bus: `tsc --noEmit` ✅
- packages/performance-core: `tsc --noEmit` ✅
- packages/settings: `tsc --noEmit` ✅
- packages/notifications: `tsc --noEmit` ✅
- packages/ide-core: `tsc --noEmit` ✅
- packages/ui: `tsc --noEmit` ✅
- apps/web: `vite build` ✅ (52 modules, 865ms)
- `npm run test` ✅ (1 test passed)
- `npx eslint` ✅ (v10.4.0)

---

## Toplam Durum

- Toplam task: 14
- Tamamlanan: 14
- Kısmen tamamlanan: 0
- Beklemede: 0

## Sonraki Adım

Tüm Pre-Phase A görevleri tamamlandı. Faz A'ya geçilebilir.
