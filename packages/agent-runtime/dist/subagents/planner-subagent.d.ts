/**
 * Planner SubAgent
 *
 * Specialized SubAgent for decomposing tasks into subtasks, creating
 * execution plans, and analyzing risks and affected modules.
 *
 * Permission Level: observe (read-only, planning only)
 * Risk Level: low
 */
import { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentTask, SubAgentResult, SubAgentRole } from "./types.js";
export declare const PLANNER_SUBAGENT_DEFINITION: SubAgentDefinition;
export interface PlanStep {
    /** Step number in the plan */
    order: number;
    /** Which subagent role should execute this step */
    targetRole: SubAgentRole;
    /** Human-readable description of what this step does */
    description: string;
    /** Instruction for the subagent that will execute this step */
    instruction: string;
    /** Whether this step requires user approval before execution */
    requiresApproval: boolean;
    /** Risk level of this step */
    riskLevel: "low" | "medium" | "high";
    /** Estimated duration in milliseconds */
    estimatedDurationMs: number;
    /** Dependencies — step numbers that must complete before this step */
    dependencies: number[];
    /** Files likely affected by this step */
    affectedFiles?: string[];
}
export interface ExecutionPlan {
    /** Summary of what the plan accomplishes */
    summary: string;
    /** Ordered list of steps */
    steps: PlanStep[];
    /** Overall risk assessment */
    overallRisk: "low" | "medium" | "high";
    /** Estimated total duration */
    estimatedTotalDurationMs: number;
    /** Files that will be affected across all steps */
    allAffectedFiles: string[];
    /** Risks and considerations */
    risks: string[];
}
export declare class PlannerSubAgent extends BaseSubAgent {
    constructor(toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    protected execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Create a plan for fixing a bug.
     * Steps: locate → understand → fix → test → review
     */
    private handleBugFixPlan;
    /**
     * Create a plan for implementing a feature.
     * Steps: explore → design → implement → test → review
     */
    private handleFeaturePlan;
    /**
     * Create a plan for refactoring code.
     * Steps: analyze → plan → refactor → test → review
     */
    private handleRefactorPlan;
    /**
     * Create a generic plan for an unspecified task type.
     */
    private handleGenericPlan;
    /**
     * Build a structured plan result from steps.
     */
    private buildPlanResult;
    /**
     * Format a plan into a human-readable string.
     */
    private formatPlan;
}
//# sourceMappingURL=planner-subagent.d.ts.map