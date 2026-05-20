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
export declare class StartupProfiler {
    private metrics;
    private activeMetrics;
    private appStartTime;
    constructor();
    /** Mark the start of a phase */
    start(phase: string, label: string, metadata?: Record<string, unknown>): string;
    /** Mark the end of a phase by its ID */
    end(id: string): StartupMetric | undefined;
    /** Get total time since profiler creation */
    getTotalTime(): number;
    /** Get all recorded metrics */
    getMetrics(): ReadonlyArray<StartupMetric>;
    /** Get metrics for a specific phase */
    getMetricsByPhase(phase: string): StartupMetric[];
    /** Reset all metrics */
    reset(): void;
}
//# sourceMappingURL=startup-profiler.d.ts.map