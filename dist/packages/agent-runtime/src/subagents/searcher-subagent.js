/**
 * Searcher SubAgent
 *
 * Specialized SubAgent for searching code, finding patterns, and locating symbols.
 * Provides search results to the orchestrator and other SubAgents.
 *
 * Permission Level: observe (read-only)
 * Risk Level: low
 */
import { BaseSubAgent, } from "./base-subagent.js";
// ─── Searcher SubAgent Definition ───────────────────────────────────────────
export const SEARCHER_SUBAGENT_DEFINITION = {
    id: "searcher",
    name: "Code Searcher",
    role: "searcher",
    allowedTools: ["search_files", "list_files"],
    permissionLevel: "observe",
    maxContextTokens: 30_000,
    timeoutMs: 60_000, // 60 seconds for large repos
    supportsParallel: true,
    description: "Searches code patterns, locates symbols, and finds relevant files across the workspace.",
};
// ─── Searcher SubAgent Implementation ───────────────────────────────────────
export class SearcherSubAgent extends BaseSubAgent {
    constructor(toolExecutor, eventEmitter, approvalHandler) {
        super(SEARCHER_SUBAGENT_DEFINITION, toolExecutor, eventEmitter, approvalHandler);
    }
    async execute(task, tools) {
        const startTime = Date.now();
        // Extract search parameters from task context
        const pattern = task.context.metadata?.pattern;
        const searchPath = task.context.metadata?.searchPath;
        const filePattern = task.context.metadata?.filePattern;
        if (!pattern) {
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: "failed",
                output: "No search pattern provided. Please specify 'pattern' in task context metadata.",
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Missing required 'pattern' in task context metadata",
                    recoverable: false,
                },
                durationMs: Date.now() - startTime,
                completedAt: Date.now(),
            };
        }
        // Execute search
        try {
            const searchInput = {
                path: searchPath ?? ".",
                regex: pattern,
            };
            if (filePattern) {
                searchInput.file_pattern = filePattern;
            }
            const result = await tools.call("search_files", searchInput);
            const durationMs = Date.now() - startTime;
            const searchResults = this.parseSearchResults(result.output);
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.success
                    ? `Found ${searchResults.length} match(es) for pattern "${pattern}"`
                    : `Search failed: ${result.error ?? result.output}`,
                data: {
                    searchResults,
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
                output: `Search failed: ${String(error)}`,
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
     * Parse raw search output into structured SearchResult objects.
     * This is a best-effort parser — the actual format depends on the tool implementation.
     */
    parseSearchResults(rawOutput) {
        const results = [];
        const lines = rawOutput.split("\n");
        for (const line of lines) {
            // Try to parse common grep-like format: file:line:col:match
            const match = line.match(/^(.+?):(\d+):(\d+):(.+)$/);
            if (match) {
                results.push({
                    filePath: match[1],
                    lineNumber: parseInt(match[2], 10),
                    column: parseInt(match[3], 10),
                    matchText: match[4].trim(),
                });
            }
        }
        return results;
    }
}
//# sourceMappingURL=searcher-subagent.js.map