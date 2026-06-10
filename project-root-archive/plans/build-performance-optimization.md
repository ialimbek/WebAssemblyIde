# Codembly Build & Runtime Performance Optimization Plan

**Version:** 0.6.0 -> 0.7.0
**Date:** 2026-06-07
**Goal:** Dramatically accelerate desktop (Tauri) and web builds while keeping RAM usage flat or reduced.

---

## Executive Summary

The Codembly IDE currently has **zero build-level optimizations** configured:
- No manual chunk splitting, no `sideEffects` declarations, no bundle analysis
- No Rust `[profile.release]` settings (no LTO, no strip, no codegen-units tuning)
- No monorepo build orchestration (no Turborepo/Nx caching)
- No Web Workers, no list virtualization, no `React.memo`
- Monaco Editor (2-5MB), isomorphic-git (200KB+), and 31 language contributions loaded eagerly
- WASM top-level `await` blocks the entire module graph at startup
- All computation runs on the main thread

This plan addresses **build speed**, **bundle size**, **startup time**, and **runtime performance** in 7 phases, ordered by impact-to-effort ratio.

---

## Phase 1: Vite Build Optimization (Highest Impact, Low Effort)

**Goal:** Reduce production bundle size by 40-60% and build time by 30-50%.
**RAM Impact:** Neutral or reduced (smaller bundles = less memory at runtime).

### 1.1 Manual Chunk Splitting

**File:** `apps/web/vite.config.ts`

Add `build.rollupOptions.output.manualChunks` to separate heavy dependencies into isolated chunks:

```
manualChunks:
  vendor-react:    ["react", "react-dom"]
  vendor-monaco:   ["monaco-editor"]
  vendor-git:      ["isomorphic-git"]
  vendor-tauri:    ["@tauri-apps/api"]
  vendor-marked:   ["marked"]
  vendor-icons:    ["lucide-react"]
```

**Why:** Without manual chunks, Vite's default chunking bundles everything into a few large files. Separate chunks enable:
- Parallel downloading (HTTP/2 multiplexing)
- Independent caching (Monaco update doesn't invalidate React cache)
- Better tree-shaking per chunk

**RAM Impact:** Neutral. Same total code loaded, but better browser caching behavior.

### 1.2 Add `sideEffects: false` to All Package `package.json` Files

**Files:** All 21 `packages/*/package.json`

Add `"sideEffects": false` to every pure-ESM package. Exception: `packages/wasm-shared` (has top-level await side effect for WASM instantiation) should declare `"sideEffects": ["./src/wasm.ts", "./dist/wasm.js"]`.

**Why:** Without `sideEffects: false`, Rollup must conservatively include all imported modules even if their exports are unused. This single change can eliminate 15-30% of dead code in the final bundle.

**RAM Impact:** Reduced. Less code parsed and held in V8 memory.

### 1.3 Switch Minifier to Terser with Advanced Compression

**File:** `apps/web/vite.config.ts`

```
build:
  minify: "terser"
  terserOptions:
    compress:
      drop_console: true
      drop_debugger: true
      passes: 2
      pure_funcs: ["console.log", "console.info"]
    mangle:
      safari10: true
    format:
      comments: false
```

**Why:** Terser achieves 5-15% smaller output than esbuild's minifier for production builds. The `drop_console` and `pure_funcs` options eliminate debug logging that wastes memory at runtime.

**Trade-off:** Terser is slower than esbuild for minification (~2-3x), but this only affects production builds, not dev. For dev speed, esbuild remains the default.

**RAM Impact:** Reduced at runtime (smaller parsed JS). Build-time RAM slightly higher during terser pass.

### 1.4 Externalize Tauri APIs from Web Build

**Files:** `apps/web/src/platform/file-system-adapter.ts`, `apps/web/src/services/GitService.ts`

Convert static `import { invoke } from "@tauri-apps/api/core"` to dynamic `await import(...)` behind a runtime platform check. Add `@tauri-apps/api` to `build.rollupOptions.external` for pure web builds.

**Why:** Tauri APIs are dead code in browser-only deployments. Currently ~15KB of Tauri IPC bridge code is bundled into the web build unnecessarily.

**RAM Impact:** Reduced for web builds.

### 1.5 Bundle Analysis Tooling

**File:** `apps/web/vite.config.ts`, `package.json`

Add `rollup-plugin-visualizer` as a dev dependency and configure it behind an env flag:

```
plugins: [
  react(),
  process.env.ANALYZE && visualizer({ open: true, gzipSize: true, brotliSize: true })
]
```

Add npm script: `"build:analyze": "ANALYZE=true vite build"`

**Why:** Without visibility into bundle composition, future optimization is blind. This is a diagnostic tool, not a runtime change.

### 1.6 CSS Code Splitting and Asset Optimization

**File:** `apps/web/vite.config.ts`

```
build:
  cssCodeSplit: true
  assetsInlineLimit: 4096
  chunkSizeWarningLimit: 500
```

**Why:** Ensures CSS is split per-chunk (relevant when CSS modules are adopted later) and small assets are inlined to reduce HTTP requests.

### 1.7 Desktop Vite Config Alignment

**File:** `apps/desktop/vite.config.ts`

The desktop Vite config is currently vestigial (Tauri serves `../../web/dist`). Either:
- **Option A:** Remove it entirely and delete `apps/desktop/src/` (since `App.tsx` imports from `@webassembly-ide/web`)
- **Option B:** Align it with the web config (same aliases, same build target, same optimizations) if a separate desktop frontend is planned

**Recommendation:** Option A for now. Reduces maintenance surface and eliminates confusion.

---

## Phase 2: Rust/Tauri Build Optimization (High Impact, Low Effort)

**Goal:** Reduce Tauri binary size by 30-50%, speed up Rust compilation by 20-40%.
**RAM Impact:** Neutral or reduced (smaller binary, smaller runtime memory footprint).

### 2.1 Add `[profile.release]` to Root `Cargo.toml`

**File:** `Cargo.toml` (workspace root)

```toml
[profile.release]
lto = "thin"
codegen-units = 1
strip = "symbols"
panic = "abort"
opt-level = 3
incremental = false

[profile.release.package."*"]
opt-level = 2
```

**Why:**
- `lto = "thin"`: Cross-crate inlining without the extreme compile time of `"fat"` LTO. Reduces binary size by 10-20%.
- `codegen-units = 1`: Enables maximum LLVM optimization. Slower compile but significantly smaller/faster output.
- `strip = "symbols"`: Removes debug symbols from release binary. Can reduce binary by 30-50%.
- `panic = "abort"`: Eliminates unwinding tables. Smaller binary, slightly faster panics.
- `opt-level = 2` for dependencies: Faster dependency compilation without meaningful runtime difference.

**RAM Impact:** Reduced at runtime (smaller binary, fewer loaded symbols). Build-time RAM slightly higher due to `codegen-units = 1`.

### 2.2 Add `[profile.dev]` Optimizations for Faster Dev Builds

**File:** `Cargo.toml`

```toml
[profile.dev]
opt-level = 0
incremental = true

[profile.dev.package."*"]
opt-level = 2
```

**Why:** Compiling dependencies at `opt-level = 2` in dev mode makes them faster at runtime without significantly slowing compilation (dependencies rarely change). This is especially impactful for `tauri`, `serde`, and `notify`.

### 2.3 Add `.cargo/config.toml` for Build Acceleration

**File:** `.cargo/config.toml`

```toml
[build]
# Use multiple codegen units for dev builds (faster compile)
# Release builds override this via profile.release.codegen-units = 1

[target.x86_64-pc-windows-msvc]
# Use parallel MSVC linker
rustflags = ["-C", "link-args=/DEBUG:NONE"]

[target.x86_64-unknown-linux-gnu]
# Use mold linker for 5-10x faster linking on Linux
rustflags = ["-C", "link-arg=-fuse-ld=mold"]
```

**Why:** Linker time dominates Rust compilation for large projects. Mold on Linux provides 5-10x faster linking. On Windows, disabling debug info in link args speeds up the link step.

### 2.4 Remove Skeleton Wasm Crates from Workspace (or Implement Them)

**Files:** `Cargo.toml`, `crates/wasm-parser/`, `crates/wasm-indexer/`, `crates/wasm-diff/`

The three Rust Wasm crates are empty stubs (10 lines each) but `wasm-parser` declares `tree-sitter = "0.22"` which pulls in C compilation. This adds significant build time for zero functionality.

**Options:**
- **Option A (Recommended):** Remove from `[workspace.members]` until implementation begins. Keep the crate directories but exclude from builds.
- **Option B:** Remove `tree-sitter` dependency from `wasm-parser` until actually needed.

### 2.5 Consolidate `desktop-host` Crate

**Files:** `crates/desktop-host/`, `apps/desktop/src-tauri/src/lib.rs`

The `desktop-host` crate duplicates functionality already implemented in `src-tauri/src/lib.rs`. Either wire it as a proper Tauri plugin or remove it from the workspace to reduce build time.

### 2.6 Centralize Workspace Dependencies

**File:** `Cargo.toml`

```toml
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
log = "0.4"
wasm-bindgen = "0.2"
tauri = { version = "2.11.2" }
```

Then in member crates: `serde = { workspace = true }`.

**Why:** Ensures version consistency and reduces dependency resolution time.

---

## Phase 3: Monorepo Build Orchestration (High Impact, Medium Effort)

**Goal:** Reduce incremental build time by 50-80% via caching and parallelism.
**RAM Impact:** Neutral.

### 3.1 Adopt Turborepo for Build Orchestration

**Files:** `turbo.json` (new), `package.json` (root)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": true
    }
  }
}
```

**Why:** Turborepo provides:
- **Content-hash based caching:** If a package's source hasn't changed, its build output is reused. For a 21-package monorepo, this eliminates 80-90% of redundant work on incremental builds.
- **Parallel execution:** Independent packages build simultaneously.
- **Dependency-aware ordering:** Packages build in correct topological order automatically.
- **Remote caching (optional):** CI builds can share cache with local dev.

**RAM Impact:** Neutral. Turborepo itself is lightweight (Go binary).

### 3.2 Add Build Scripts to Each Package

Currently, most packages have no `build` script in their `package.json`. Add:

```json
{
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --build --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

This enables Turborepo to cache per-package TypeScript compilation.

### 3.3 Optimize TypeScript Project References

**File:** `tsconfig.json` (root)

Currently only 12 of 21 packages are in the project references list. Add all packages that produce `.d.ts` output:
- `agent-tools`, `browser-runtime`, `terminal-runtime`, `scratchpad-runtime`, `context-engine`, `lsp-client`, `extension-api`, `devtools`, `ai-gateway`

**Why:** Missing references mean `tsc --build` cannot properly track cross-package dependencies, leading to either missed rebuilds or unnecessary full rebuilds.

---

## Phase 4: Startup and Runtime Performance (Critical Impact, Medium Effort)

**Goal:** Achieve sub-1.5s interactive startup, reduce main thread blocking.
**RAM Impact:** Reduced (deferred loading = less memory at startup).

### 4.1 Eliminate WASM Top-Level Await Blocking

**File:** `packages/wasm-shared/src/wasm.ts`

**Current:** Top-level `await` blocks the entire module graph. Since `generateId()` is called by `NotificationManager`, `WorkspaceManager`, etc. at construction time, the WASM module MUST load before any manager initializes.

**Solution:** Lazy-initialize the WASM module with JS fallbacks for critical functions during startup:

```typescript
let wasmInstance: WasmModule | null = null;
let wasmReady = false;

const wasmInitPromise = loadAndInstantiate().then(m => {
  wasmInstance = m;
  wasmReady = true;
});

export function generateId(): string {
  if (wasmReady && wasmInstance) return wasmInstance.generateId();
  return crypto.randomUUID();
}

export function scoreMatch(...): number {
  if (wasmReady && wasmInstance) return wasmInstance.scoreMatch(...);
  return jsFallbackScoreMatch(...);
}

export function waitForWasm(): Promise<void> {
  return wasmInitPromise;
}
```

**Why:** Removes the top-level await, unblocking the module graph. The app shell renders immediately while WASM loads in the background. JS fallbacks handle the brief window before WASM is ready.

**RAM Impact:** Reduced at startup. WASM memory is allocated only when needed, not at module load.

### 4.2 Wire LazyModuleRegistry into Application Bootstrap

**Files:** `apps/web/src/main.tsx`, `apps/web/src/ide-context.tsx`

Connect the existing `LazyModuleRegistry` and `StartupProfiler` to the application:

1. In `main.tsx`: Instantiate `StartupProfiler`, measure `app-shell-first-paint`.
2. In `IDEProvider`: Register heavy modules (LSP, AI Gateway, Terminal PTY, Browser Bridge, Git) with `LazyModuleRegistry`.
3. Load deferred modules only when their panel is first opened.

**Why:** The infrastructure exists but is completely disconnected. Wiring it enforces the shell-first architecture defined in `ARCHITECTURE.md`.

**RAM Impact:** Significantly reduced at startup. Heavy modules (AI Gateway, Terminal, Browser) are not loaded until needed.

### 4.3 Selective Monaco Language Loading

**File:** `packages/editor/src/monaco-languages.ts`

**Current:** All 31 language contributions load in a single `Promise.all()` when Monaco initializes.

**Solution:** Load only the language needed for the first opened file, then lazily load others on demand:

```typescript
const loadedLanguages = new Set<string>();

export async function loadLanguageForFile(filePath: string): Promise<void> {
  const langId = detectLanguageForPath(filePath);
  if (loadedLanguages.has(langId)) return;
  loadedLanguages.add(langId);
  const loader = languageLoaders[langId];
  if (loader) await loader();
}

export async function loadAllLanguages(): Promise<void> {
  await Promise.all(Object.values(languageLoaders).map(fn => fn()));
}
```

**Why:** Loading 31 language contributions adds ~200-500ms to Monaco initialization. Most users work with 3-5 languages per session. Load-on-demand reduces initial Monaco load time by 70-80%.

**RAM Impact:** Reduced. Only loaded language grammars consume memory.

### 4.4 Add Web Workers for Heavy Computation

**New files:** `packages/shared/src/workers/`

Create dedicated workers for:
1. **SearchWorker:** `findPlainTextMatches()` across workspace files
2. **FuzzyWorker:** `scoreItemsByQuery()` for command palette with large candidate sets
3. **ParseWorker:** Markdown parsing (`marked.parse()`), syntax highlighting pre-processing
4. **GitWorker:** Git status parsing, diff computation

**Architecture:**
```
Main Thread                    Worker Thread
-----------                    -------------
User types query    ------->   Fuzzy scoring
                                |
Results returned    <-------   Sorted results
```

**Why:** The architecture explicitly requires "parsing, indexing, search, diff, embeddings, context ranking, and large file scans must avoid blocking the UI thread." Currently ALL of these run on the main thread.

**RAM Impact:** Slightly higher (workers have their own memory space), but offset by moving heavy data structures off the main thread. Net effect: more responsive UI with same total RAM.

### 4.5 Add List Virtualization

**Dependency:** `@tanstack/react-virtual` (lightweight, ~5KB gzipped)

Apply to:
- `CommandPalette` results list (200+ items)
- `ExplorerPanel` file tree (10,000+ entries in large workspaces)
- `SearchPanel` results
- `SourceControlPanel` file list
- `NotificationCenter` history

**Why:** Without virtualization, rendering 1000+ DOM nodes causes severe jank. Virtual rendering keeps only visible items in the DOM (typically 20-50 items), reducing DOM memory by 90%+ for large lists.

**RAM Impact:** Significantly reduced for large workspaces. DOM nodes are the #1 memory consumer in browser-based IDEs.

### 4.6 Add `React.memo` to Frequently Re-rendered Components

**Files:** All panel components, row/item components

Wrap with `React.memo()`:
- `FileItemRow` (ExplorerPanel)
- `CommandItemRow` (CommandPalette)
- `SearchResultRow` (SearchPanel)
- `TabBar` / `TabItem`
- `TerminalSessionTab`
- `NotificationItem`
- `GitFileRow` (SourceControlPanel)

**Why:** Without `React.memo`, every state change in a parent causes all children to re-render. For a file tree with 500 items, a single selection change triggers 500 re-renders. With `React.memo`, only the previously-selected and newly-selected items re-render.

**RAM Impact:** Reduced. Fewer React fiber allocations and less GC pressure.

---

## Phase 5: Caching and Persistence (Medium Impact, Medium Effort)

**Goal:** Faster repeat loads, offline support, reduced network/disk I/O.
**RAM Impact:** Neutral (disk-backed cache replaces in-memory cache).

### 5.1 Implement IndexedDB Cache for Web

**New file:** `packages/ide-core/src/cache/indexeddb-cache.ts`

Cache:
- Workspace tree snapshots (avoid re-scanning on every load)
- Theme and keybinding data
- Recent files and workspaces
- Extension metadata
- Search index

**RAM Impact:** Reduced. Data moves from `localStorage` (synchronous, 5MB limit, parsed on every read) to IndexedDB (async, large capacity, binary support).

### 5.2 Implement SQLite Cache for Desktop

**New file:** `packages/ide-core/src/cache/sqlite-cache.ts`

Use Tauri's `sql` plugin or `rusqlite` in Rust for:
- Workspace tree with file metadata
- Git status cache
- Search index persistence
- Editor state (open tabs, cursor positions)

### 5.3 Add Service Worker for Web (PWA)

**File:** `apps/web/src/sw.ts` (new), `apps/web/vite.config.ts`

Use `vite-plugin-pwa` with Workbox:
- Precache app shell and critical chunks
- Runtime cache for Monaco language contributions
- Stale-while-revalidate for API calls

**RAM Impact:** Neutral. Service Worker runs in its own context.

### 5.4 Add Preload Hints to `index.html`

**File:** `apps/web/index.html`

```html
<link rel="modulepreload" href="/src/main.tsx">
<link rel="preload" href="/assets/release.wasm" as="fetch" crossorigin>
<link rel="preconnect" href="https://releases.codembly.local">
```

---

## Phase 6: Context and State Optimization (Medium Impact, Low Effort)

**Goal:** Reduce unnecessary re-renders, lower GC pressure.
**RAM Impact:** Reduced.

### 6.1 Split IDE Context

**File:** `apps/web/src/ide-context.tsx`

Split the monolithic `IDEContext` into focused contexts:
- `EditorContext` (tabs, models, cursor, dirty state)
- `WorkspaceContext` (file tree, metadata, FS adapter)
- `ThemeContext` (active theme, theme list)
- `TerminalContext` (sessions, output)
- `AgentContext` (orchestrator state)
- `LayoutContext` (panel visibility, collapsed states)

**Why:** Currently, ANY state change in `IDEProvider` triggers re-renders of ALL consumers. With split contexts, a theme change only re-renders theme consumers, not the entire app.

### 6.2 Add `useDeferredValue` and `useTransition` for Non-Urgent Updates

Apply to:
- File tree updates (deferred)
- Search results (deferred, already partially done in CommandPalette)
- Git status changes (transition)
- Notification arrivals (transition)

### 6.3 Bound In-Memory Caches

**Files:** `MarkdownPreview.tsx`, `CorePanels.tsx`

Add LRU eviction to unbounded `Map` caches:
- `previewCache`: Max 50 entries
- `diffCache`: Max 20 entries

Use a simple LRU implementation or `lru-cache` package (~2KB).

---

## Phase 7: AssemblyScript WASM Optimization (Low Impact, Low Effort)

**Goal:** Reduce WASM binary size, improve WASM function performance.

### 7.1 Increase AssemblyScript Optimization

**File:** `packages/wasm-shared/asconfig.json`

```json
"release": {
  "optimizeLevel": 3,
  "shrinkLevel": 2,
  "converge": true,
  "noAssert": true,
  "exportRuntime": false
}
```

Changes:
- `shrinkLevel: 2` (from 1): Maximum size reduction
- `converge: true`: Iterate optimization passes until stable
- `noAssert: true`: Remove assertion checks in release
- `exportRuntime: false`: Don't export AS runtime (reduces surface area)

**Note:** `exportRuntime: false` requires updating `wasm.ts` to not use AS runtime exports. Verify string marshaling still works.

### 7.2 Add `wasm-opt` Post-Processing

Add Binaryen's `wasm-opt` as a post-build step:

```json
"scripts": {
  "build:release": "asc assembly/index.ts --target release && wasm-opt build/release.wasm -O4 -o build/release.wasm"
}
```

**Why:** `wasm-opt` achieves 10-20% additional size reduction beyond what AssemblyScript's compiler produces.

---

## Implementation Priority Matrix

| Phase | Impact | Effort | RAM Impact | Priority |
|-------|--------|--------|------------|----------|
| 1. Vite Build Optimization | Very High | Low | Reduced | P0 |
| 2. Rust/Tauri Build Optimization | High | Low | Reduced | P0 |
| 3. Monorepo Build Orchestration | High | Medium | Neutral | P1 |
| 4. Startup & Runtime Performance | Critical | Medium | Reduced | P0 |
| 5. Caching & Persistence | Medium | Medium | Neutral | P2 |
| 6. Context & State Optimization | Medium | Low | Reduced | P1 |
| 7. AssemblyScript WASM Optimization | Low | Low | Neutral | P3 |

---

## Expected Results

### Build Speed

| Metric | Before | After (Estimated) |
|--------|--------|-------------------|
| Web production build (`vite build`) | ~15-30s | ~8-15s |
| Incremental web build (cached) | ~15-30s | ~2-5s |
| Tauri release build | ~5-10min | ~3-6min |
| TypeScript type-check (`tsc --build`) | ~10-20s | ~3-8s (cached) |
| Dev server cold start | ~5-10s | ~3-5s |

### Bundle Size

| Chunk | Before (Estimated) | After (Estimated) |
|-------|--------------------|--------------------|
| Main bundle | ~800KB-1.2MB gzipped | ~300-500KB gzipped |
| Monaco chunk | ~500KB-1MB gzipped | ~500KB-1MB (isolated) |
| Vendor chunk | Mixed | ~150-200KB (isolated) |
| Tauri binary | ~15-25MB | ~8-15MB |
| WASM module | 22KB | ~15-18KB |

### Startup Time

| Metric | Target | Before | After (Estimated) |
|--------|--------|--------|-------------------|
| App shell first paint | 1000ms | ~2000-3000ms | ~800-1200ms |
| Interactive startup | 1500ms | ~3000-5000ms | ~1200-1800ms |
| Monaco ready | 1800ms | ~3000-4000ms | ~1500-2000ms |

### RAM Usage

| Scenario | Before | After |
|----------|--------|-------|
| Idle (shell only) | ~150-250MB | ~100-180MB |
| Editor open (1 file) | ~250-400MB | ~200-350MB |
| Large workspace (10K files) | ~500-800MB | ~350-600MB |

---

## Affected Files Summary

### Modified Files
- `apps/web/vite.config.ts`
- `apps/desktop/vite.config.ts` (or removed)
- `Cargo.toml` (workspace root)
- `.cargo/config.toml` (new)
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/web/index.html`
- `packages/wasm-shared/asconfig.json`
- `packages/wasm-shared/src/wasm.ts`
- `packages/editor/src/monaco-languages.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/ide-context.tsx`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/web/src/services/GitService.ts`
- All 21 `packages/*/package.json` (add `sideEffects`, build scripts)
- `tsconfig.json` (root, add missing references)
- `package.json` (root, add Turborepo)

### New Files
- `turbo.json`
- `.cargo/config.toml`
- `packages/ide-core/src/cache/indexeddb-cache.ts`
- `packages/ide-core/src/cache/sqlite-cache.ts`
- `packages/shared/src/workers/search-worker.ts`
- `packages/shared/src/workers/fuzzy-worker.ts`
- `packages/shared/src/workers/parse-worker.ts`
- `apps/web/src/sw.ts`

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Terser slows production builds | Only use for production; dev uses esbuild |
| `codegen-units = 1` slows Rust compile | Only in release profile; dev uses default 256 |
| `sideEffects: false` breaks WASM init | Explicit exception for `wasm-shared/src/wasm.ts` |
| Turborepo cache corruption | `turbo clean` + CI cache invalidation |
| Worker communication overhead | Benchmark before/after; fall back to main thread for small inputs |
| `React.memo` over-optimization | Only apply to list items and frequently re-rendered components |
| Context splitting breaking changes | Incremental migration; keep legacy context as alias during transition |
| `exportRuntime: false` breaks WASM string marshaling | Test thoroughly before applying; keep `true` if issues arise |

---

## Validation Approach

1. **Build speed:** Measure `time npm run build` and `time cargo build --release` before/after each phase.
2. **Bundle size:** Use `rollup-plugin-visualizer` to compare bundle composition.
3. **Startup time:** Use `StartupProfiler` (once wired) to measure all 6 startup metrics.
4. **RAM usage:** Chrome DevTools Memory tab (Heap Snapshot + Timeline) for web; Task Manager for desktop.
5. **Correctness:** Run `npm run test`, `npm run lint`, `cargo test --workspace` after each phase.
6. **Regression:** Verify all existing functionality (editor, terminal, file tree, git, agent panel, search).
