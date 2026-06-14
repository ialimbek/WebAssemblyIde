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
export type { PermissionLevel, RiskLevel, SubAgentRole, ToolName, SubAgentDefinition, SubAgentTask, SubAgentContext, SubAgentResultStatus, SubAgentResult, SubAgentResultData, FileChange, PatchInfo, SearchResult, CommandResult, DiagnosticInfo, Finding, ToolCallRecord, TokenUsage, SubAgentError, SubAgentErrorCode, SubAgentEvent, SubAgentEventType, } from "./subagents/types.js";
export { BaseSubAgent, SubAgentToolProxy, type ToolExecutor, type ToolExecutionResult, type SubAgentEventEmitter, type ApprovalHandler, } from "./subagents/base-subagent.js";
export { ReaderSubAgent, READER_SUBAGENT_DEFINITION, } from "./subagents/reader-subagent.js";
export { SearcherSubAgent, SEARCHER_SUBAGENT_DEFINITION, } from "./subagents/searcher-subagent.js";
export { WriterSubAgent, WRITER_SUBAGENT_DEFINITION, } from "./subagents/writer-subagent.js";
export { ExecutorSubAgent, EXECUTOR_SUBAGENT_DEFINITION, } from "./subagents/executor-subagent.js";
export { ReviewerSubAgent, REVIEWER_SUBAGENT_DEFINITION, } from "./subagents/reviewer-subagent.js";
export { PlannerSubAgent, PLANNER_SUBAGENT_DEFINITION, type PlanStep, type ExecutionPlan, } from "./subagents/planner-subagent.js";
export { SubAgentOrchestrator, type OrchestratorConfig, type OrchestratorMode, type OrchestrationRequest, type OrchestrationResult, } from "./subagents/orchestrator.js";
//# sourceMappingURL=index.d.ts.map