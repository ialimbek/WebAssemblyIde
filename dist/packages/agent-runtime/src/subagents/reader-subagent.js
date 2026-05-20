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
import { BaseSubAgent, } from "./base-subagent.js";
// ─── Reader SubAgent Definition ─────────────────────────────────────────────
export const READER_SUBAGENT_DEFINITION = {
    id: "reader",
    name: "File Reader",
    role: "reader",
    allowedTools: ["read_file", "list_files"],
    permissionLevel: "observe",
    maxContextTokens: 50_000,
    timeoutMs: 30_000, // 30 seconds
    supportsParallel: true,
    description: "Reads and analyzes files from the workspace. Provides file contents, structure, and metadata to other subagents.",
};
// ─── Reader SubAgent Implementation ─────────────────────────────────────────
export class ReaderSubAgent extends BaseSubAgent {
    constructor(toolExecutor, eventEmitter, approvalHandler) {
        super(READER_SUBAGENT_DEFINITION, toolExecutor, eventEmitter, approvalHandler);
    }
    async execute(task, tools) {
        const startTime = Date.now();
        const filesRead = [];
        const errors = [];
        // Determine which files to read
        const filePaths = task.context.filePaths ?? [];
        if (filePaths.length === 0) {
            // If no specific files, try to list the workspace
            return await this.handleListTask(task, tools, startTime);
        }
        // Read each file
        const fileContents = {};
        for (const filePath of filePaths) {
            try {
                const result = await tools.call("read_file", {
                    path: filePath,
                });
                if (result.success) {
                    fileContents[filePath] = result.output;
                    filesRead.push(filePath);
                }
                else {
                    errors.push(`Failed to read "${filePath}": ${result.error ?? result.output}`);
                }
            }
            catch (error) {
                errors.push(`Error reading "${filePath}": ${String(error)}`);
            }
        }
        const durationMs = Date.now() - startTime;
        // Build the result
        const status = errors.length === 0
            ? "success"
            : filesRead.length > 0
                ? "partial"
                : "failed";
        const output = this.buildOutputSummary(filesRead, errors, fileContents);
        return {
            taskId: task.id,
            subAgentId: this.definition.id,
            status,
            output,
            data: {
                filesRead,
                custom: { fileContents },
            },
            toolCalls: tools.getCallLog(),
            durationMs,
            completedAt: Date.now(),
        };
    }
    /**
     * Handle a task that asks to list directory contents instead of reading specific files.
     */
    async handleListTask(task, tools, startTime) {
        const workspaceRoot = task.context.workspaceRoot ?? ".";
        const listPath = task.context.metadata?.listPath ?? workspaceRoot;
        try {
            const result = await tools.call("list_files", {
                path: listPath,
                recursive: task.context.metadata?.recursive === true,
            });
            const durationMs = Date.now() - startTime;
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.success
                    ? `Listed contents of "${listPath}":\n${result.output}`
                    : `Failed to list "${listPath}": ${result.error ?? result.output}`,
                data: {
                    custom: { listing: result.output, path: listPath },
                },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: "failed",
                output: `Failed to list directory: ${String(error)}`,
                error: {
                    code: "INTERNAL_ERROR",
                    message: String(error),
                    recoverable: true,
                },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
    }
    /**
     * Build a human-readable summary of what was read.
     */
    buildOutputSummary(filesRead, errors, fileContents) {
        const parts = [];
        if (filesRead.length > 0) {
            parts.push(`Successfully read ${filesRead.length} file(s):`);
            for (const path of filesRead) {
                const lineCount = fileContents[path]?.split("\n").length ?? 0;
                parts.push(`  - ${path} (${lineCount} lines)`);
            }
        }
        if (errors.length > 0) {
            parts.push(`\n${errors.length} error(s):`);
            for (const err of errors) {
                parts.push(`  - ${err}`);
            }
        }
        return parts.join("\n");
    }
}
//# sourceMappingURL=reader-subagent.js.map