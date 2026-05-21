/**
 * @webassembly-ide/performance-core
 *
 * Startup profiling, lazy module registry, and cache coordination.
 */
// ─── Startup Profiler ───────────────────────────────────────────────────────
export { StartupProfiler, } from "./startup-profiler.js";
// ─── Lazy Module Registry ───────────────────────────────────────────────────
export { LazyModuleRegistry, } from "./lazy-module-registry.js";
// ─── Startup Contracts ──────────────────────────────────────────────────────
export { assertCriticalStartupModule, CRITICAL_STARTUP_PATH, DEFERRED_STARTUP_MODULES, STARTUP_MEASUREMENT_POINTS, } from "./startup-contracts.js";
//# sourceMappingURL=index.js.map