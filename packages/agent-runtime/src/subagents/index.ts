/**
 * SubAgents Module — Centralized Exports
 *
 * Provides the full SubAgent architecture: BaseSubAgent, concrete
 * implementations, the orchestrator, and shared types.
 *
 * Usage:
 *   import { SubAgentOrchestrator, ReaderSubAgent } from "@webassembly-ide/agent-runtime/subagents";
 */

// ─── Types ─────────────────────────────────────────────────────────────────
export type {
  SubAgentRole,
  SubAgentDefinition,
  SubAgentTask,
  SubAgentContext,
  SubAgentResult,
  SubAgentResultStatus,
  SubAgentResultData,
  SubAgentError,
  SubAgentErrorCode,
  SubAgentEvent,
  SubAgentEventType,
  FileChange,
  SearchResult,
  DiagnosticInfo,
  Finding,
  PlanStep,
  ExecutionPlan,
  ToolName,
  PermissionLevel,
} from "./types";

// ─── Base & Infrastructure ─────────────────────────────────────────────────
export {
  BaseSubAgent,
  SubAgentToolProxy,
  type ToolExecutor,
  type SubAgentEventEmitter,
  type ApprovalHandler,
} from "./base-subagent";

// ─── Orchestrator ──────────────────────────────────────────────────────────
export {
  SubAgentOrchestrator,
  type OrchestratorConfig as SubAgentOrchestratorConfig,
  type OrchestratorMode,
  type OrchestrationRequest,
  type OrchestrationResult,
} from "./orchestrator";

// ─── Concrete SubAgents ────────────────────────────────────────────────────
export { ReaderSubAgent, READER_SUBAGENT_DEFINITION } from "./reader-subagent";
export { SearcherSubAgent, SEARCHER_SUBAGENT_DEFINITION } from "./searcher-subagent";
export { WriterSubAgent, WRITER_SUBAGENT_DEFINITION } from "./writer-subagent";
export { ExecutorSubAgent, EXECUTOR_SUBAGENT_DEFINITION } from "./executor-subagent";
export { ReviewerSubAgent, REVIEWER_SUBAGENT_DEFINITION } from "./reviewer-subagent";
export { PlannerSubAgent, PLANNER_SUBAGENT_DEFINITION } from "./planner-subagent";
