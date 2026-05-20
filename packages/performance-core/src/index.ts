/**
 * @webassembly-ide/performance-core
 *
 * Startup profiling, lazy module registry, and cache coordination.
 */

// ─── Startup Profiler ───────────────────────────────────────────────────────
export {
  StartupProfiler,
  type StartupMetric,
  type StartupPhase,
} from "./startup-profiler.js";

// ─── Lazy Module Registry ───────────────────────────────────────────────────
export {
  LazyModuleRegistry,
  type LazyModuleDefinition,
  type LazyModuleState,
} from "./lazy-module-registry.js";
