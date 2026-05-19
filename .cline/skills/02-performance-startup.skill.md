# Skill: Performance and Startup

## Use When

- Implementing `performance-core`.
- Designing startup flow.
- Adding lazy-loaded panels or services.

## Procedure

1. Identify whether a module belongs to the critical startup path or lazy path.
2. Keep heavy services out of initial render.
3. Add measurement points for first paint, interactive startup, workspace tree visible time, first file open, Monaco ready, terminal ready, browser preview ready, agent ready, and indexing completion.
4. Use persistent cache only for non-secret metadata/context.
5. Prefer worker-first execution for CPU-heavy work.

## Validation

- Inspect bundle/module boundaries.
- Confirm lazy imports for panels.
- Confirm no heavy connector or Wasm initialization occurs during app shell boot.
