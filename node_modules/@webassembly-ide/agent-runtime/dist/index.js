/**
 * @webassembly-ide/agent-runtime
 *
 * Agent Runtime package for WebAssemblyIde.
 * Provides SubAgent architecture for decomposed, secure, auditable task execution.
 *
 * Architecture alignment (ARCHITECTURE.md §6):
 * - SubAgent Orchestrator coordinates specialized agents
 * - All tool access goes through Tool Registry (ToolExecutor interface)
 * - Permission levels: observe → suggest → edit → execute → autonomous
 * - Every action is audit-logged via Event Bus
 * - User approval required for medium/high risk operations
 */
// ─── Base SubAgent ──────────────────────────────────────────────────────────
export { BaseSubAgent, SubAgentToolProxy, } from "./subagents/base-subagent.js";
// ─── Concrete SubAgents ─────────────────────────────────────────────────────
export { ReaderSubAgent, READER_SUBAGENT_DEFINITION, } from "./subagents/reader-subagent.js";
export { SearcherSubAgent, SEARCHER_SUBAGENT_DEFINITION, } from "./subagents/searcher-subagent.js";
export { WriterSubAgent, WRITER_SUBAGENT_DEFINITION, } from "./subagents/writer-subagent.js";
export { ExecutorSubAgent, EXECUTOR_SUBAGENT_DEFINITION, } from "./subagents/executor-subagent.js";
export { ReviewerSubAgent, REVIEWER_SUBAGENT_DEFINITION, } from "./subagents/reviewer-subagent.js";
export { PlannerSubAgent, PLANNER_SUBAGENT_DEFINITION, } from "./subagents/planner-subagent.js";
// ─── Orchestrator ───────────────────────────────────────────────────────────
export { SubAgentOrchestrator, } from "./subagents/orchestrator.js";
//# sourceMappingURL=index.js.map