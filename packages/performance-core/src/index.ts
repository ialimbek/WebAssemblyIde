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

// ─── Startup Contracts ──────────────────────────────────────────────────────
export {
  assertCriticalStartupModule,
  CRITICAL_STARTUP_PATH,
  DEFERRED_STARTUP_MODULES,
  STARTUP_MEASUREMENT_POINTS,
  type CriticalStartupModule,
  type DeferredStartupModule,
  type StartupMeasurementPoint,
  type StartupPhaseId,
} from "./startup-contracts.js";
