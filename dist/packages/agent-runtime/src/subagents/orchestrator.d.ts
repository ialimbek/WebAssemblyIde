/**
 * SubAgent Orchestrator
 *
 * The central coordinator that manages SubAgent lifecycle, dispatches tasks,
 * collects results, handles parallel/sequential execution, and merges outputs.
 *
 * This is the main entry point for the Agent Runtime to use SubAgents.
 * It receives high-level tasks from the Plan/Act Mode Orchestrators and
 * breaks them down into SubAgent-executable units.
 *
 * Architecture alignment:
 * - Communicates through Command Bus / Event Bus
 * - SubAgents access tools only through Tool Registry
 * - Approval workflow enforced at every medium/high risk operation
 * - All actions are audit-logged
 */
import { BaseSubAgent, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentResult, SubAgentRole } from "./types.js";
export interface OrchestratorConfig {
    /** Maximum number of SubAgents that can run concurrently */
    maxConcurrency: number;
    /** Default timeout for the entire orchestration */
    defaultTimeoutMs: number;
    /** Whether to stop execution on first failure */
    failFast: boolean;
}
export type OrchestratorMode = "plan" | "act" | "review" | "autonomous";
export interface OrchestrationRequest {
    /** Unique request ID */
    id: string;
    /** The high-level task description */
    goal: string;
    /** Mode determines execution strategy */
    mode: OrchestratorMode;
    /** Relevant files */
    filePaths?: string[];
    /** Workspace root */
    workspaceRoot?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
export interface OrchestrationResult {
    /** Request ID */
    requestId: string;
    /** Overall status */
    status: "success" | "partial" | "failed" | "cancelled";
    /** Summary of what was accomplished */
    summary: string;
    /** All SubAgent results in execution order */
    results: SubAgentResult[];
    /** Total duration */
    totalDurationMs: number;
    /** Total tool calls made */
    totalToolCalls: number;
    /** Any errors encountered */
    errors: string[];
}
export declare class SubAgentOrchestrator {
    private readonly subAgents;
    private readonly config;
    private readonly eventEmitter?;
    private readonly toolExecutor;
    private readonly approvalHandler?;
    constructor(toolExecutor: ToolExecutor, config?: Partial<OrchestratorConfig>, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    /**
     * Orchestrate a task using SubAgents.
     * This is the main entry point.
     *
     * In "plan" mode: only uses Planner, Reader, Searcher
     * In "act" mode: uses all SubAgents sequentially following a plan
     * In "review" mode: uses Reviewer, Reader, Searcher
     * In "autonomous" mode: uses Planner first, then executes the plan
     */
    orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult>;
    /**
     * Register a custom SubAgent.
     */
    registerSubAgent(subAgent: BaseSubAgent): void;
    /**
     * Get a SubAgent by its role.
     */
    getSubAgentByRole(role: SubAgentRole): BaseSubAgent | undefined;
    /**
     * Get all registered SubAgent definitions.
     */
    getRegisteredDefinitions(): SubAgentDefinition[];
    /**
     * Plan mode: only observe-level SubAgents.
     * Planner creates the plan, Reader/Searcher gather context.
     */
    private executePlanMode;
    /**
     * Act mode: execute a pre-defined plan sequentially.
     * Each step runs the appropriate SubAgent based on its role.
     */
    private executeActMode;
    /**
     * Review mode: read files, search patterns, and review.
     */
    private executeReviewMode;
    /**
     * Autonomous mode: Planner creates plan, then execute each step.
     * Combines plan + act modes.
     */
    private executeAutonomousMode;
    /**
     * Register the default set of SubAgents.
     */
    private registerDefaultSubAgents;
    /**
     * Create a SubAgentTask from an orchestration request.
     */
    private createTask;
    /**
     * Determine overall status from a set of results.
     */
    private determineOverallStatus;
    /**
     * Build a human-readable summary of the orchestration.
     */
    private buildSummary;
}
//# sourceMappingURL=orchestrator.d.ts.map