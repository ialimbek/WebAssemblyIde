/**
 * Writer SubAgent
 *
 * Specialized SubAgent for generating patches and writing files.
 * Requires user approval for all file modification operations.
 *
 * Permission Level: edit (requires approval)
 * Risk Level: medium
 */
import { BaseSubAgent, } from "./base-subagent.js";
// ─── Writer SubAgent Definition ─────────────────────────────────────────────
export const WRITER_SUBAGENT_DEFINITION = {
    id: "writer",
    name: "Code Writer",
    role: "writer",
    allowedTools: ["read_file", "write_file", "apply_patch", "list_files"],
    permissionLevel: "edit",
    maxContextTokens: 60_000,
    timeoutMs: 60_000,
    supportsParallel: false,
    description: "Generates patches, writes files, and applies code changes. All modifications require user approval.",
};
// ─── Writer SubAgent Implementation ─────────────────────────────────────────
export class WriterSubAgent extends BaseSubAgent {
    constructor(toolExecutor, eventEmitter, approvalHandler) {
        super(WRITER_SUBAGENT_DEFINITION, toolExecutor, eventEmitter, approvalHandler);
    }
    async execute(task, tools) {
        const startTime = Date.now();
        // Extract operation type from task context
        const operation = task.context.metadata?.operation;
        switch (operation) {
            case "apply_patch":
                return this.handleApplyPatch(task, tools, startTime);
            case "write_file":
                return this.handleWriteFile(task, tools, startTime);
            default:
                return {
                    taskId: task.id,
                    subAgentId: this.definition.id,
                    status: "failed",
                    output: `Unknown writer operation: "${operation}". Supported: apply_patch, write_file`,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: `Unsupported operation: ${operation}`,
                        recoverable: false,
                    },
                    durationMs: Date.now() - startTime,
                    completedAt: Date.now(),
                };
        }
    }
    // ─── Operation Handlers ──────────────────────────────────────────────
    /**
     * Handle an apply_patch operation.
     * Reads a patch/diff description and applies it to the target file.
     * Requires user approval before writing.
     */
    async handleApplyPatch(task, tools, startTime) {
        const filePath = task.context.metadata?.filePath;
        const diffContent = task.context.metadata?.diff;
        const description = task.context.metadata?.description;
        if (!filePath || !diffContent) {
            return this.errorResult(task.id, "Missing required 'filePath' or 'diff' in task context metadata.", startTime, tools);
        }
        // Request approval before applying patch
        const approved = await tools.requestApproval(`Apply patch to "${filePath}"`, description ?? diffContent.substring(0, 200));
        if (!approved) {
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: "cancelled",
                output: `Patch application to "${filePath}" was denied by user.`,
                durationMs: Date.now() - startTime,
                completedAt: Date.now(),
                toolCalls: tools.getCallLog(),
            };
        }
        try {
            const result = await tools.call("apply_patch", {
                path: filePath,
                diff: diffContent,
            });
            const durationMs = Date.now() - startTime;
            const filesChanged = [
                { path: filePath, type: "modify", diff: diffContent },
            ];
            const patches = [
                {
                    filePath,
                    unifiedDiff: diffContent,
                    description: description ?? "Applied patch",
                },
            ];
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.success
                    ? `Successfully applied patch to "${filePath}"`
                    : `Failed to apply patch: ${result.error ?? result.output}`,
                data: { filesChanged, patches },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
        catch (error) {
            return this.errorResult(task.id, String(error), startTime, tools);
        }
    }
    /**
     * Handle a write_file operation.
     * Writes content directly to a file. Requires user approval.
     */
    async handleWriteFile(task, tools, startTime) {
        const filePath = task.context.metadata?.filePath;
        const content = task.context.metadata?.content;
        if (!filePath || content === undefined) {
            return this.errorResult(task.id, "Missing required 'filePath' or 'content' in task context metadata.", startTime, tools);
        }
        // Request approval before writing
        const approved = await tools.requestApproval(`Write file "${filePath}"`, `Write ${content.length} characters to "${filePath}"`);
        if (!approved) {
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: "cancelled",
                output: `File write to "${filePath}" was denied by user.`,
                durationMs: Date.now() - startTime,
                completedAt: Date.now(),
                toolCalls: tools.getCallLog(),
            };
        }
        try {
            const result = await tools.call("write_file", {
                path: filePath,
                content,
            });
            const durationMs = Date.now() - startTime;
            const filesChanged = [{ path: filePath, type: "modify" }];
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.success
                    ? `Successfully wrote to "${filePath}"`
                    : `Failed to write file: ${result.error ?? result.output}`,
                data: { filesChanged },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
        catch (error) {
            return this.errorResult(task.id, String(error), startTime, tools);
        }
    }
    // ─── Helpers ─────────────────────────────────────────────────────────
    errorResult(taskId, message, startTime, tools) {
        return {
            taskId,
            subAgentId: this.definition.id,
            status: "failed",
            output: message,
            error: {
                code: "INTERNAL_ERROR",
                message,
                recoverable: true,
            },
            toolCalls: tools.getCallLog(),
            durationMs: Date.now() - startTime,
            completedAt: Date.now(),
        };
    }
}
//# sourceMappingURL=writer-subagent.js.map