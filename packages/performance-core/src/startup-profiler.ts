import { generateId } from "@webassembly-ide/shared";

/** A measured startup phase/metric */
export interface StartupMetric {
  id: string;
  phase: string;
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/** Named startup phase */
export interface StartupPhase {
  name: string;
  description: string;
}

/**
 * Startup Profiler — measures IDE startup performance.
 *
 * Tracks critical path components and lazy-loaded module init times.
 */
export class StartupProfiler {
  private metrics: StartupMetric[] = [];
  private activeMetrics = new Map<string, StartupMetric>();
  private appStartTime: number;

  constructor() {
    this.appStartTime = performance.now();
  }

  /** Mark the start of a phase */
  start(
    phase: string,
    label: string,
    metadata?: Record<string, unknown>,
  ): string {
    const id = generateId("metric");
    const metric: StartupMetric = {
      id,
      phase,
      label,
      startTime: performance.now(),
      metadata,
    };
    this.activeMetrics.set(id, metric);
    return id;
  }

  /** Mark the end of a phase by its ID */
  end(id: string): StartupMetric | undefined {
    const metric = this.activeMetrics.get(id);
    if (!metric) return undefined;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    this.activeMetrics.delete(id);
    this.metrics.push(metric);
    return metric;
  }

  /** Get total time since profiler creation */
  getTotalTime(): number {
    return performance.now() - this.appStartTime;
  }

  /** Get all recorded metrics */
  getMetrics(): ReadonlyArray<StartupMetric> {
    return this.metrics;
  }

  /** Get metrics for a specific phase */
  getMetricsByPhase(phase: string): StartupMetric[] {
    return this.metrics.filter((m) => m.phase === phase);
  }

  /** Reset all metrics */
  reset(): void {
    this.metrics = [];
    this.activeMetrics.clear();
    this.appStartTime = performance.now();
  }
}
