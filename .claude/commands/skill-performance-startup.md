# Skill: Performance and Startup

Use when designing `performance-core`, panel lazy loading, cache strategy, or startup measurement points.

Steps:
1. Decide whether a module belongs in the critical startup path or the lazy path.
2. Keep heavy services out of the first render.
3. Consider metrics: first paint, interactive startup, workspace tree visible, first file open, Monaco ready, terminal ready, browser preview ready, agent ready, indexing completion.
4. Recommend IndexedDB/OPFS or SQLite/libSQL caching for non-secret metadata/context.
5. Move CPU-heavy work into a worker/sidecar.

Validation:
- Are lazy import boundaries clear?
- Are heavy Wasm/LSP/AI/terminal/browser loads removed from the startup path?
- Is the UI thread being blocked?
