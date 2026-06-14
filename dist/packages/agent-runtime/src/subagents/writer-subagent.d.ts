/**
 * Writer SubAgent
 *
 * Specialized SubAgent for generating patches and writing files.
 * Requires user approval for all file modification operations.
 *
 * Permission Level: edit (requires approval)
 * Risk Level: medium
 */
import { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentTask, SubAgentResult } from "./types.js";
export declare const WRITER_SUBAGENT_DEFINITION: SubAgentDefinition;
export declare class WriterSubAgent extends BaseSubAgent {
    constructor(toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    protected execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Handle an apply_patch operation.
     * Reads a patch/diff description and applies it to the target file.
     * Requires user approval before writing.
     */
    private handleApplyPatch;
    /**
     * Handle a write_file operation.
     * Writes content directly to a file. Requires user approval.
     */
    private handleWriteFile;
    private errorResult;
}
//# sourceMappingURL=writer-subagent.d.ts.map