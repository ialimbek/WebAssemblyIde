---
title: "Tauri to Wails Migration"
created_at: "2026-06-06 15:17:00"
status: completed
---

# Tauri to Wails Migration - Research Index

## Objective

Analyze the potential benefits and feasibility of migrating from Tauri v2 to Wails for the Codembly IDE desktop shell. Evaluate:
- Technical advantages/disadvantages
- Migration complexity
- Performance implications
- Ecosystem maturity
- Go vs Rust backend impact
- WebAssembly integration differences
- Long-term maintainability

## Sources

1. DEV Community - Tauri(rust) vs Wails(go) comparison
2. Ali Gündoğdu - Building a Desktop App with Wails in 2025
3. JetBrains Blog - Rust vs Go: Which One to Choose in 2025
4. LogRocket Blog - Go vs. Rust: When to use Rust and when to use Go
5. Wails.io official documentation
6. Current project analysis: `apps/desktop/src-tauri/src/lib.rs`, `crates/desktop-host/src/lib.rs`

## Key Findings

### Performance Comparison

**Rust (Tauri) Advantages:**
- No garbage collector → deterministic performance, lower latency
- 30%+ faster than Go in benchmarks (up to 12x faster in some cases)
- Better memory efficiency → smaller memory footprint
- Zero-cost abstractions → no runtime performance penalty
- Superior for computation-heavy tasks, system-level programming

**Go (Wails) Advantages:**
- Garbage collector optimized for low latency
- Excellent concurrency model (goroutines) for web services
- Faster development cycles due to simpler syntax
- Good enough performance for most desktop applications

### Framework Maturity

**Tauri v2:**
- Mature plugin ecosystem (tauri-plugin-fs, tauri-plugin-shell, tauri-plugin-store, etc.)
- Strong security model by design
- Multi-window support fully implemented
- Rich notification system
- Large and growing community
- Extensive documentation

**Wails v2:**
- Simpler learning curve (can learn in one day)
- Easier configuration and setup
- Multi-window support still under development
- Notifications still under development
- Smaller but growing community
- Good documentation

### Build Size & Performance

- **Wails:** ~20 MB builds (vs Electron's 150 MB)
- **Tauri:** Similar or smaller sizes (no embedded Chrome)
- Both significantly lighter than Electron

### WebAssembly Integration

**Critical for this project:**
- Project already uses Rust Wasm crates: `wasm-parser`, `wasm-indexer`, `wasm-diff`
- Go has WASM support but ecosystem is less mature for parser/indexing workloads
- Rust's WASM toolchain (wasm-bindgen, wasm-pack) is more established
- Migrating Wasm crates to Go would require significant rewrite

### Current Project Tauri Usage

**`apps/desktop/src-tauri/src/lib.rs` (~1000 lines):**
- Workspace management (open, validate, watch)
- File system operations (read, write, delete, rename, list)
- Git integration (status, add, commit, branches, log, diff)
- File watching with notify crate
- Permission model (workspace root enforcement, allowed files)
- Cross-platform file dialogs (rfd)

**`crates/desktop-host/src/lib.rs`:**
- Designed as Tauri plugin
- FS operations, command execution
- Serialization/deserialization with serde

### Migration Complexity

**High complexity factors:**
1. **Language migration:** Rust → Go requires full rewrite of ~1000+ lines
2. **Wasm crates:** `wasm-parser`, `wasm-indexer`, `wasm-diff` would need Go equivalents
3. **Tauri plugins:** Would need to find or build Wails equivalents
4. **Team expertise:** Need Go expertise if team is Rust-focused
5. **Testing:** Full regression testing required for all desktop features
6. **Build pipeline:** CI/CD would need Go toolchain instead of Rust

**Estimated effort:** 4-8 weeks for full migration + testing

## Recommendations

### Recommendation: DO NOT Migrate to Wails

**Reasons:**

1. **No clear performance gain:** Wails/Go is actually slower than Tauri/Rust for computation-heavy tasks
2. **WebAssembly compatibility:** Project's Rust Wasm crates would need complete rewrite in Go
3. **Feature parity loss:** Wails lacks multi-window and notifications (still in development)
4. **Migration cost:** 4-8 weeks of work with questionable ROI
5. **Ecosystem maturity:** Tauri has more mature plugin ecosystem
6. **Team expertise:** If team knows Rust, staying with Tauri is more efficient
7. **Architecture alignment:** ARCHITECTURE.md explicitly chooses Tauri v2 + Rust backend

### When Wails Might Make Sense

Consider Wails only if:
- Team has strong Go expertise and no Rust experience
- Project requires extremely fast iteration cycles over performance
- Multi-window and notifications are not needed
- WebAssembly parser/indexing is not a core requirement
- Simplicity of setup is more important than feature completeness

### Alternative: Stay with Tauri v2

**Advantages of current choice:**
- Rust performance for Wasm services
- Mature plugin ecosystem
- Full feature set (multi-window, notifications)
- Strong security model
- Growing community
- Aligned with ARCHITECTURE.md vision
- No migration cost

**Potential improvements within Tauri:**
- Optimize existing Rust code if performance issues arise
- Leverage Tauri v2's improved plugin system
- Use Tauri's built-in updater, window-state, log plugins
- Consider Tauri's mobile support if needed later

## Related

- ARCHITECTURE.md - Desktop layer specification (Tauri v2)
- TODO.md - Implementation order
- crates/wasm-parser, crates/wasm-indexer, crates/wasm-diff - Rust Wasm services
