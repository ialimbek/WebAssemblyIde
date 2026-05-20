/**
 * Reader SubAgent
 *
 * Specialized SubAgent for reading and analyzing files.
 * This is the most fundamental SubAgent — it reads file contents,
 * extracts metadata, and provides structured information to other
 * SubAgents or the main orchestrator.
 *
 * Permission Level: observe (read-only)
 * Risk Level: low
 */
import { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentTask, SubAgentResult } from "./types.js";
export declare const READER_SUBAGENT_DEFINITION: SubAgentDefinition;
export declare class ReaderSubAgent extends BaseSubAgent {
    constructor(toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    protected execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Handle a task that asks to list directory contents instead of reading specific files.
     */
    private handleListTask;
    /**
     * Build a human-readable summary of what was read.
     */
    private buildOutputSummary;
}
//# sourceMappingURL=reader-subagent.d.ts.map