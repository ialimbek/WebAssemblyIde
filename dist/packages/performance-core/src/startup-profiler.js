import { generateId } from "@webassembly-ide/shared";
/**
 * Startup Profiler — measures IDE startup performance.
 *
 * Tracks critical path components and lazy-loaded module init times.
 */
export class StartupProfiler {
    metrics = [];
    activeMetrics = new Map();
    appStartTime;
    constructor() {
        this.appStartTime = performance.now();
    }
    /** Mark the start of a phase */
    start(phase, label, metadata) {
        const id = generateId("metric");
        const metric = {
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
    end(id) {
        const metric = this.activeMetrics.get(id);
        if (!metric)
            return undefined;
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
        this.activeMetrics.delete(id);
        this.metrics.push(metric);
        return metric;
    }
    /** Get total time since profiler creation */
    getTotalTime() {
        return performance.now() - this.appStartTime;
    }
    /** Get all recorded metrics */
    getMetrics() {
        return this.metrics;
    }
    /** Get metrics for a specific phase */
    getMetricsByPhase(phase) {
        return this.metrics.filter((m) => m.phase === phase);
    }
    /** Reset all metrics */
    reset() {
        this.metrics = [];
        this.activeMetrics.clear();
        this.appStartTime = performance.now();
    }
}
//# sourceMappingURL=startup-profiler.js.map