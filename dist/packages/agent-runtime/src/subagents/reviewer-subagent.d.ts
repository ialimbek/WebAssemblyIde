/**
 * Reviewer SubAgent
 *
 * Specialized SubAgent for reviewing diffs, checking architecture compliance,
 * identifying security risks, and finding test gaps.
 *
 * Permission Level: observe (read-only)
 * Risk Level: low
 */
import { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentTask, SubAgentResult } from "./types.js";
export declare const REVIEWER_SUBAGENT_DEFINITION: SubAgentDefinition;
export declare class ReviewerSubAgent extends BaseSubAgent {
    constructor(toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    protected execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Perform a security-focused review on specified files.
     */
    private handleSecurityReview;
    /**
     * Perform an architecture compliance review.
     */
    private handleArchitectureReview;
    /**
     * Review a git diff for issues.
     */
    private handleDiffReview;
    /**
     * Perform a full review combining security, architecture, and diff checks.
     */
    private handleFullReview;
    /**
     * Analyze a unified diff for potential issues.
     */
    private analyzeDiff;
    /**
     * Build a structured review result.
     */
    private buildReviewResult;
}
//# sourceMappingURL=reviewer-subagent.d.ts.map