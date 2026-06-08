# Codembly Extreme IDE Performance & Near-Zero Idle RAM Plan

**Date:** 2026-06-08
**Basis:** Audit of `plans/build-performance-optimization.md` against current repository state.
**Mode:** Planning/report only. No application code changes were made.

---

## Goal

Make Codembly feel instant for real-world projects while keeping memory flat or lower:

- IDE shell opens almost immediately.
- First file open/read/save feels native-fast.
- Git changes panel opens without blocking UI.
- Idle app unloads or avoids heavy services so memory is close to a minimal WebView shell.
- WASM is used more aggressively only for CPU-heavy pure compute, but never loaded on the critical startup path unless strictly required.

---

## Deliverables

- Implementation-status report for the existing build/runtime performance plan.
- New phase-based optimization plan focused on file open/read/save, IDE startup, Git changes startup, workspace hydration, WASM acceleration, cache strategy, and idle memory discipline.
- Clear success criteria, constraints, affected files/modules, and validation approach.

---

## Success Criteria

Target numbers must be measured locally on desktop and web with the same fixture workspaces.

| Area | Target |
| --- | --- |
| Cold app shell visible | <= 500 ms desktop, <= 800 ms web |
| Interactive shell | <= 800 ms desktop, <= 1200 ms web |
| Open recent workspace tree snapshot | <= 150 ms from cached snapshot |
| Open first small text file | <= 50 ms after click, excluding Monaco first-load cold cost |
| Open first file with Monaco cold | <= 700 ms for editor visible, language loads deferred |
| Read file native bridge overhead | <= 10 ms for small files after workspace opened |
| Save small file | <= 30 ms p95 desktop, async UI acknowledgement immediately after accepted write |
| Git status panel visible | <= 150 ms with cached status, refresh streamed in background |
| Idle RAM after no workspace | Minimal shell only; no Monaco, no WASM, no Git, no Agent, no Terminal loaded |
| Idle RAM after workspace closed | Return to shell-only memory band after GC/unload cycle |

---

## Constraints

- Preserve `ARCHITECTURE.md`: shell-first startup, worker-first execution, deferred WASM/LSP/AI/terminal/browser/git, persistent cache through IndexedDB/OPFS or SQLite/libSQL.
- Preserve module boundaries: UI panels must not own core business logic; Agent Runtime must use Tool Registry/Command Bus boundaries.
- Do not increase idle RAM to improve speed. Speed improvements must come from lazy loading, caching, native/Rust sidecar work, worker execution, and incremental hydration.
- Do not put full terminal/build systems into WASM.
- Use WASM for parsing, indexing, search, fuzzy ranking, diff/patch helpers, AST summaries, and text transforms when it beats JS and can run in a worker.
- Avoid loading WASM at module import time.

---

## Existing Plan Implementation Status

### Summary

The existing plan is **partially implemented**. Build-level optimizations are stronger than runtime optimizations. Several files/classes exist, but many are not wired into the app path, so they do not yet deliver the expected speed/RAM benefit.

| Phase | Status | Evidence | Remaining Gap |
| --- | --- | --- | --- |
| Phase 1: Vite build optimization | Partially implemented | `apps/web/vite.config.ts` has manual chunks, Terser fallback, CSS splitting, visualizer, PWA optional plugin, web external option. `sideEffects` exists in all 21 package manifests. | `file-system-adapter.ts` and `GitService.ts` still statically import Tauri APIs. `vendor-icons` chunk not relevant/no lucide dependency found. Desktop Vite config still vestigial. Pure web externalization is incomplete. |
| Phase 2: Rust/Tauri build optimization | Mostly implemented | Root `Cargo.toml` has `profile.dev`, `profile.release`, and `workspace.dependencies`. `.cargo/config.toml` exists. Workspace members only include `apps/desktop/src-tauri`, so skeleton crates are excluded from normal workspace builds. | `.cargo/config.toml` only has Windows MSVC linker flag; Linux mold config from the plan is absent. Skeleton crates still contain dependencies if built directly. `desktop-host` still exists as a duplicate/stub crate but is not in workspace. |
| Phase 3: Monorepo build orchestration | Partially implemented | `turbo.json` exists; root scripts include `build:turbo`, `typecheck`; package build/typecheck scripts exist. | Root `npm run build` still uses `tsc --build`, not Turbo by default. Root `tsconfig.json` references only 12 packages, not all package outputs. Turbo adoption is available but not the primary path. |
| Phase 4: Startup/runtime performance | Weakly implemented | `StartupProfiler` and `LazyModuleRegistry` exist; `main.tsx` measures first paint; Monaco language loading is per-language; LRU caps exist for markdown and diff caches. | `IDEProvider` still constructs `GitService`, `TerminalSessionManager`, `AgentOrchestrator`, managers, i18n/accessibility, and theme at startup. Worker files exist but are not instantiated. Search and fuzzy scoring still run on main thread. No list virtualization or `React.memo` usage found. WASM is still imported early through shared utilities. |
| Phase 5: Caching/persistence | Skeleton implemented | `IndexedDbCache`, `SqliteCache`, `apps/web/src/sw.ts`, and PWA config exist. | Cache classes are exported but not used by workspace tree, git status, file metadata, session restore, recent workspaces, or editor state. SQLite bridge has no desktop implementation. Service worker is minimal. |
| Phase 6: Context/state optimization | Mostly not implemented | `useDeferredValue` exists only in `CommandPalette`. Diff and markdown caches are bounded. | `IDEContext` remains monolithic; any context update can trigger broad re-renders. No systematic transitions/deferred updates for file tree, Git status, search, notifications. No virtualization. |
| Phase 7: AssemblyScript WASM optimization | Partially implemented | `asconfig.json` has `optimizeLevel: 3`, `shrinkLevel: 2`, `converge`, `noAssert`; `wasm-opt` script exists. | `exportRuntime` remains `true`, likely required by current string marshaling. Optimized script is not the default build. WASM still loads eagerly at import through `void waitForWasm()`. |

---

## Key Audit Findings

1. **WASM is on the startup path indirectly.** `packages/shared/src/utils/id.ts` and `assert.ts` re-export from `@webassembly-ide/wasm-shared`; `StartupProfiler` uses `generateId`, so startup imports `wasm-shared`. `wasm.ts` then starts `void waitForWasm()` at import time.
2. **LazyModuleRegistry is not enforcing lazy runtime behavior.** It registers modules, but `IDEProvider` creates Git, Terminal, Agent, Workspace, AutoSave, UndoRedo, Accessibility, i18n, and Theme managers eagerly.
3. **Workers are skeletons, not active acceleration.** `search-worker.ts`, `fuzzy-worker.ts`, `parse-worker.ts`, and `git-worker.ts` exist, but no `new Worker(...)` usage was found.
4. **Search is still main-thread heavy.** `SearchPanel` reads files sequentially and runs matching in the UI component loop.
5. **Git status is process-per-action on desktop.** Tauri runs `git` commands through `std::process::Command`; there is no persistent Git status service, cache, watch-triggered coalescing, or background refresh queue.
6. **Workspace tree cache is in-memory only.** `WorkspaceManager` has a simple `treeCache`, but it is not persisted to IndexedDB/SQLite and is invalidated broadly on writes/deletes/renames.
7. **File read/write is simple and correct, but not optimized for large files.** Desktop reads whole file into memory and converts to `String`; writes whole content with `fs::write`. There is no chunked read, mmap strategy, binary guard, large-file guard, read-through cache, or save journal.
8. **No list virtualization is present.** Large explorer/search/git/notification lists can create many DOM nodes and extra React work.
9. **Desktop Vite config remains a maintenance trap.** `apps/desktop/vite.config.ts` is still a minimal vestigial config while desktop actually serves the web build.
10. **Build optimizations are ahead of runtime optimizations.** The repo has chunking, sideEffects, Terser, profiles, Turbo, and package scripts, but runtime still loads and computes too much in the UI path.

---

## New Extreme Performance Strategy

The new strategy is not “load everything faster”; it is “load almost nothing, then hydrate exactly what the user touches, from cache first, on a worker/sidecar, with aggressive eviction when idle.”

### Architecture Principle

```txt
Startup Shell
  -> cached UI state only
  -> workspace snapshot only if recent workspace is restored
  -> no Monaco until first editor surface needs it
  -> no WASM until CPU-heavy compute needs it
  -> no Git process until Source Control opens or workspace watcher reports Git-relevant changes
  -> no Agent/Terminal/LSP/Browser/Scratchpad until panel activation
```

---

## Phase X0: Measurement Baseline and Performance Gates

**Goal:** Stop guessing. Make every speed/RAM claim measurable before implementation.

**Deliverables:**

- Local performance fixture workspaces: tiny, medium, 10k files, 100k files metadata-only, large Git repo, large single file.
- Perf scenarios: cold launch, warm launch, open workspace, open first file, save file, open Source Control, search query, idle 60s, close workspace.
- Local profiler events for file read/write, Tauri invoke latency, tree scan, Git status, Monaco init, WASM init, worker job time, cache hit/miss, memory estimate.
- CI/local gate script that fails only when explicitly run for performance validation.

**Affected files/modules:**

- `packages/performance-core/src/*`
- `apps/web/src/main.tsx`
- `apps/web/src/ide-context.tsx`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/desktop/src-tauri/src/lib.rs`
- `packages/devtools/src/*`

**Validation:**

- Run scenario suite before and after each phase.
- Record p50/p95 latency and memory snapshots.

---

## Phase X1: True Shell-Only Startup

**Goal:** Idle/no-workspace startup must not load Git, Agent, Terminal, Monaco, WASM, isomorphic-git, marked, LSP, Browser, Scratchpad, or full workspace managers beyond tiny interfaces.

**Deliverables:**

- Split `IDEProvider` into a thin Shell Provider plus lazy domain providers.
- Replace eager class construction with factories/proxies for Git, Terminal, Agent, Monaco, cache, workers, and WASM.
- Move `@webassembly-ide/wasm-shared` out of `@webassembly-ide/shared` startup path. `generateId` and assertions should be pure JS in startup-critical shared utilities; WASM utilities should be opt-in through compute runtime.
- Remove `void waitForWasm()` from import path; initialize WASM only through an explicit async compute runtime or worker preload after idle.
- Convert static Tauri imports in `file-system-adapter.ts` and `GitService.ts` to runtime-checked dynamic imports.

**Affected files/modules:**

- `apps/web/src/ide-context.tsx`
- `apps/web/src/main.tsx`
- `packages/shared/src/utils/id.ts`
- `packages/shared/src/utils/assert.ts`
- `packages/wasm-shared/src/wasm.ts`
- `apps/web/src/hooks/useWasmComponentRuntime.ts`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/web/src/services/GitService.ts`

**Validation:**

- Bundle trace confirms no `wasm-shared`, `isomorphic-git`, `monaco-editor`, `marked`, terminal, agent, or Tauri chunks in initial pure web startup chunk.
- Startup memory after no-workspace launch is shell-only.

---

## Phase X2: Instant Workspace Open Through Snapshot Hydration

**Goal:** Workspace tree appears from persistent cache first, then refreshes incrementally in background.

**Deliverables:**

- Persist workspace tree snapshots keyed by root path, mtime/version hash, ignore config, and app schema version.
- Desktop SQLite cache implementation behind `SqliteCacheBridge`.
- Web IndexedDB cache wiring for browser/demo/OPFS mode.
- Incremental tree hydration: root entries first, expanded folders on demand, background refresh queue with cancellation.
- Avoid recursive watcher memory pressure for massive repos by using coarse watcher plus on-demand stat batches where platform requires it.

**Affected files/modules:**

- `packages/ide-core/src/workspace-manager.ts`
- `packages/ide-core/src/cache/indexeddb-cache.ts`
- `packages/ide-core/src/cache/sqlite-cache.ts`
- `apps/web/src/components/ExplorerPanel.tsx`
- `apps/web/src/platform/file-system-adapter.ts`
- `apps/desktop/src-tauri/src/lib.rs`

**Validation:**

- Warm workspace tree visible <= 150 ms.
- Large ignored folders do not increase open latency linearly.
- Memory remains bounded when opening a 100k-file workspace.

---

## Phase X3: Native-Fast File Read, Open, and Save

**Goal:** File operations must feel instant without holding unnecessary duplicate content in RAM.

**Deliverables:**

- Desktop file metadata cache: path, size, mtime, hash-lite, encoding, last opened offset/window.
- Small-file fast path: one native read, immediate editor model hydrate.
- Large-file guard: preview mode, chunked/lazy read, line index sidecar, binary detection, user-confirmed full load.
- Save pipeline: write to temp file, atomic rename, update metadata cache, emit one coalesced event; UI marks “save accepted” immediately and confirms persisted when native write completes.
- Debounced auto-save queue with backpressure and cancellation on rapid edits.
- Avoid duplicate strings where possible: do not keep full file content in workspace cache if Monaco already owns the model; store metadata and dirty state separately.

**Affected files/modules:**

- `apps/desktop/src-tauri/src/lib.rs`
- `apps/web/src/platform/file-system-adapter.ts`
- `packages/ide-core/src/workspace-manager.ts`
- `packages/editor/src/editor-manager.ts`
- `packages/editor/src/editor-model.ts`
- `packages/ide-core/src/auto-save.ts`

**Validation:**

- Small file read/open p95 <= 50 ms after workspace warm.
- Save p95 <= 30 ms desktop for small files.
- Large file opens in guarded preview without UI freeze or large RAM jump.

---

## Phase X4: Git Changes Panel in Under 150 ms

**Goal:** Source Control opens from cache instantly and refreshes in background without blocking the UI.

**Deliverables:**

- Git status cache persisted per workspace: branch, HEAD, status entries, last refresh timestamp.
- Desktop background Git service with coalesced refresh queue instead of one command per UI request.
- Use `git status --porcelain=v2 -z --branch --untracked-files=normal` for faster, parse-stable output.
- Watch `.git/index`, `.git/HEAD`, and working tree events to invalidate only Git cache.
- Stream status entries to UI in batches for huge repos.
- WASM/Rust parser for porcelain output if JS parsing becomes a measurable bottleneck.
- Diff content cache by `HEAD:path` and file mtime; load diff only when a file row is opened, not when Source Control opens.

**Affected files/modules:**

- `apps/web/src/services/GitService.ts`
- `apps/web/src/components/CorePanels.tsx`
- `apps/desktop/src-tauri/src/lib.rs`
- `packages/shared/src/workers/git-worker.ts`
- Future `crates/wasm-diff` or desktop Rust git helper

**Validation:**

- Source Control panel first paint <= 150 ms from cache.
- Background refresh does not block typing or panel interaction.
- 5k changed-file fixture stays responsive and virtualized.

---

## Phase X5: Worker-First Compute Runtime

**Goal:** Search, fuzzy ranking, markdown parsing, Git summarization, diff preparation, and index updates leave the main thread.

**Deliverables:**

- Worker manager package with job IDs, cancellation, timeout, transfer-friendly payloads, and result batching.
- Wire existing `search-worker.ts`, `fuzzy-worker.ts`, `parse-worker.ts`, `git-worker.ts` into UI paths.
- Search reads files through a batched producer and sends chunks to worker; results stream back progressively.
- Command Palette fuzzy scoring moves to worker when candidate count exceeds threshold; small lists stay sync to avoid worker overhead.
- Markdown preview parsing moves to worker and caches output.
- Workers terminate after idle timeout to release memory.

**Affected files/modules:**

- `packages/shared/src/workers/*`
- `apps/web/src/components/SearchPanel.tsx`
- `apps/web/src/components/CommandPalette.tsx`
- `apps/web/src/components/MarkdownPreview.tsx`
- `apps/web/src/services/GitService.ts`
- New worker runtime package or `packages/performance-core/src/worker-runtime.ts`

**Validation:**

- Main thread long tasks drop during search/fuzzy/markdown operations.
- Idle worker termination returns memory.

---

## Phase X6: WASM Acceleration Expansion, But Deferred

**Goal:** Use WASM for heavy pure compute while keeping initial and idle RAM low.

**Deliverables:**

- Replace startup-wide WASM re-exports with explicit `ComputeRuntime` API.
- WASM modules loaded only inside workers or after first compute-heavy feature activation.
- AssemblyScript `wasm-shared` remains for tiny utilities only if it wins benchmarks; otherwise move tiny startup utilities back to JS.
- Rust/WASM `wasm-diff` POC for Myers/patience diff, patch validation, and large diff summary.
- Rust/WASM `wasm-indexer` POC for incremental text index and symbol-lite records.
- Rust/WASM `wasm-parser` POC with tree-sitter for opened-file symbol extraction first, not whole-repo indexing.
- Streaming instantiate where supported; fallback to normal instantiate.
- WASM memory lifecycle policy: instantiate per worker, terminate worker on idle, no global never-freed WASM instance for idle shell.

**Affected files/modules:**

- `packages/wasm-shared/src/*`
- `packages/wasm-shared/assembly/index.ts`
- `crates/wasm-diff/*`
- `crates/wasm-indexer/*`
- `crates/wasm-parser/*`
- `packages/shared/src/workers/*`
- `packages/context-engine/src/*`

**Validation:**

- Benchmark JS vs WASM for each function with payload thresholds.
- WASM is not present in no-workspace startup chunk or initial memory profile.

---

## Phase X7: Virtualized UI and Render Containment

**Goal:** Large lists do not create large DOM/React memory pressure.

**Deliverables:**

- Virtualize Explorer tree, Search results, Source Control changes, Command Palette for large candidate sets, Notifications history, Problems list.
- Split monolithic context or introduce selector-based stores so unrelated updates do not re-render all panels.
- Memoize row components only where profiling shows row re-render pressure.
- Use `useDeferredValue`, transitions, and batched updates for Git/search/tree refreshes.
- Add panel-level visibility gates: hidden panels do not subscribe to heavy updates.

**Affected files/modules:**

- `apps/web/src/ide-context.tsx`
- `apps/web/src/components/ExplorerPanel.tsx`
- `apps/web/src/components/SearchPanel.tsx`
- `apps/web/src/components/CorePanels.tsx`
- `apps/web/src/components/CommandPalette.tsx`
- Notification and problems UI modules

**Validation:**

- DOM node count remains bounded under large data sets.
- React profiler shows small render surfaces for single selection/update changes.

---

## Phase X8: Idle Memory Reclamation

**Goal:** When idle, the app aggressively releases heavy resources without harming user data.

**Deliverables:**

- Idle coordinator in `performance-core` using activity signals, panel visibility, workspace state, dirty state, and memory pressure hints where available.
- Unload/terminate workers after idle.
- Dispose Monaco models for closed tabs and cap open model count.
- Release Git cache details in RAM after panel closes; keep persisted cache on disk.
- Dehydrate inactive Agent/Terminal/Browser/Scratchpad panels.
- Workspace close returns to shell-only state.
- Optional “Eco Idle Mode”: after N minutes, keep only shell, recent workspace metadata, dirty backup state, and notifications summary.

**Affected files/modules:**

- `packages/performance-core/src/*`
- `apps/web/src/ide-context.tsx`
- `packages/editor/src/editor-manager.ts`
- `packages/editor/src/editor-model.ts`
- `apps/web/src/services/GitService.ts`
- Worker runtime modules

**Validation:**

- Idle memory after closing panels/workspace returns near shell baseline.
- No dirty data loss during dehydration/rehydration.

---

## Recommended Implementation Order

1. X0 measurement baseline.
2. X1 true shell-only startup and WASM import removal from critical path.
3. X2 workspace snapshot hydration.
4. X3 file read/open/save fast path.
5. X4 Git cache/background service.
6. X5 worker-first compute runtime.
7. X7 virtualization/render containment.
8. X6 deeper WASM parser/indexer/diff expansion.
9. X8 idle memory reclamation and Eco Idle Mode.

Reasoning: remove startup/RAM regressions first, then make the most common user actions instant, then expand compute acceleration safely.

---

## High-Risk Current Items to Fix First

| Risk | Why It Matters | First Fix |
| --- | --- | --- |
| WASM loads from shared startup utilities | Adds startup and idle memory cost before user needs compute | Move startup `generateId`/assert back to JS or lazy compute API |
| Eager `IDEProvider` managers | Defeats shell-first architecture | Split shell provider and lazy domain providers |
| Search on main thread | Large repos freeze UI | Worker streaming search |
| Git status process per request | Slow panel and repeated process startup | Cached background Git status service |
| No persistent tree snapshot | Workspace open scales with disk scan | IndexedDB/SQLite snapshot hydration |
| No virtualization | Large lists consume DOM/RAM | Virtualize Explorer/Search/SCM first |

---

## Validation Approach

- **Structural:** bundle analyzer, dependency trace, grep for forbidden startup imports.
- **Runtime:** local startup profiler, Performance API marks, React profiler, Chrome/Tauri WebView memory snapshots.
- **Native:** Tauri command latency logs for read/write/list/git operations.
- **Worker:** long-task monitoring before/after search/fuzzy/markdown/git operations.
- **WASM:** benchmark each candidate function with thresholds; keep JS for small inputs if worker/WASM overhead is higher.
- **Regression:** `npm run build`, `npm run test`, `cargo check --workspace`, web build check, and desktop smoke scenarios.

---

## Current Conclusion

The previous plan is not fully applied. The repository has many correct foundations, but the largest speed/RAM wins remain unrealized because runtime wiring is still eager and main-thread-heavy. The next decisive improvement is not another build tweak; it is removing WASM/Git/Agent/Terminal/Monaco from the startup path, hydrating workspace/Git/file data from persistent cache, moving compute to workers, and reclaiming memory after idle.
