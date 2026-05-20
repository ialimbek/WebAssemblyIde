/**
 * Executor SubAgent
 *
 * Specialized SubAgent for running terminal commands, tests, builds, and lints.
 * All command executions require explicit user approval due to high risk level.
 *
 * Permission Level: execute (requires approval)
 * Risk Level: high
 */
import { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentTask, SubAgentResult } from "./types.js";
export declare const EXECUTOR_SUBAGENT_DEFINITION: SubAgentDefinition;
export declare class ExecutorSubAgent extends BaseSubAgent {
    constructor(toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    protected execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Handle a general shell command execution.
     * Classifies risk level and requires approval for medium/high risk commands.
     */
    private handleRunCommand;
    /**
     * Handle test execution.
     * Always requires approval.
     */
    private handleRunTests;
    /**
     * Handle package manager operations (install, uninstall, update).
     * Always requires approval.
     */
    private handlePackageManager;
    /**
     * Classify a command's risk level based on pattern matching.
     * Returns 'safe', 'medium', or 'high'.
     */
    private classifyCommandRisk;
    private errorResult;
}
//# sourceMappingURL=executor-subagent.d.ts.map