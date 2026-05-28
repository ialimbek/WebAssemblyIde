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
import type { SubAgentDefinition, SubAgentTask, SubAgentResult } from "./types.js";
export declare const PLANNER_SUBAGENT_DEFINITION: SubAgentDefinition;
export type { PlanStep, ExecutionPlan } from "./types.js";
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