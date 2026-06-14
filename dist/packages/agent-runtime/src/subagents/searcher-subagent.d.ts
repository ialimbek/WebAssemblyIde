/**
 * Searcher SubAgent
 *
 * Specialized SubAgent for searching code, finding patterns, and locating symbols.
 * Provides search results to the orchestrator and other SubAgents.
 *
 * Permission Level: observe (read-only)
 * Risk Level: low
 */
import { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type SubAgentEventEmitter, type ApprovalHandler } from "./base-subagent.js";
import type { SubAgentDefinition, SubAgentTask, SubAgentResult } from "./types.js";
export declare const SEARCHER_SUBAGENT_DEFINITION: SubAgentDefinition;
export declare class SearcherSubAgent extends BaseSubAgent {
    constructor(toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    protected execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Parse raw search output into structured SearchResult objects.
     * This is a best-effort parser — the actual format depends on the tool implementation.
     */
    private parseSearchResults;
}
//# sourceMappingURL=searcher-subagent.d.ts.map