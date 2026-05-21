/**
 * Agent Runtime core type definitions.
 * Follows ARCHITECTURE.md Agent Runtime design: Chat, Plan, Act modes.
 */

/** Agent operating modes */
export type AgentMode = "chat" | "plan" | "act" | "review" | "architect";

/** Agent session states */
export type AgentSessionState =
  | "idle"
  | "thinking"
  | "awaiting_approval"
  | "executing"
  | "paused"
  | "error"
  | "completed";

/** Permission levels from ARCHITECTURE.md §10.1 */
export type PermissionLevel =
  | "observe"
  | "suggest"
  | "edit"
  | "execute"
  | "autonomous";

/** Risk classification from ARCHITECTURE.md §10.2 */
export type RiskLevel = "low" | "medium" | "high";

/** Tool execution result */
export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown> & {
    /** Optional undo metadata emitted by tools that mutate workspace state. */
    undo?: AgentToolUndoMetadata;
  };
  filesChanged?: string[];
}

/** Metadata that lets Agent Runtime register reversible tool actions. */
export interface AgentToolUndoMetadata {
  type: "fileWrite" | "filePatch" | "custom";
  description?: string;
  path?: string;
  beforeContent?: string;
  afterContent?: string;
  customUndoId?: string;
}

/** Tool call request from agent */
export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: number;
  riskLevel: RiskLevel;
  permissionRequired: PermissionLevel;
}

/** Agent message in conversation */
export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  metadata?: Record<string, unknown>;
}

/** Agent session configuration */
export interface AgentSessionConfig {
  id: string;
  mode: AgentMode;
  permissionLevel: PermissionLevel;
  providerId?: string;
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/** Plan step produced by Plan Mode */
export interface PlanStep {
  id: string;
  order: number;
  description: string;
  affectedFiles: string[];
  riskLevel: RiskLevel;
  toolCalls: ToolCall[];
  status:
    | "pending"
    | "approved"
    | "executing"
    | "completed"
    | "failed"
    | "skipped";
  result?: ToolResult;
}

/** Plan output from Plan Mode */
export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  risks: string[];
  estimatedToolCalls: number;
  createdAt: number;
}

/** Approval request */
export interface ApprovalRequest {
  id: string;
  toolCall: ToolCall;
  description: string;
  riskLevel: RiskLevel;
  diff?: string;
  status: "pending" | "approved" | "rejected" | "timeout";
  requestedAt: number;
  respondedAt?: number;
  response?: "approve" | "reject" | "approve_all";
}

/** Audit log entry from ARCHITECTURE.md §10.3 */
export interface AuditLogEntry {
  id: string;
  sessionId: string;
  timestamp: number;
  agentMode: AgentMode;
  toolName: string;
  permissionLevel: PermissionLevel;
  riskLevel: RiskLevel;
  inputSummary: string;
  outputSummary: string;
  filesChanged: string[];
  userApprovalState: "auto" | "approved" | "rejected" | "pending";
  resultingDiff?: string;
  error?: string;
  policyViolation?: string;
}

/** Context package sent to LLM */
export interface AgentContext {
  workspaceFiles: string[];
  activeFile?: string;
  recentFiles: string[];
  terminalOutput?: string;
  diagnostics?: string;
  gitDiff?: string;
  symbolIndex?: string;
  userMessage: string;
}

/** Agent event types for Event Bus integration */
export type AgentEventType =
  | "agent.session.created"
  | "agent.session.state_changed"
  | "agent.mode.changed"
  | "agent.tool.call_started"
  | "agent.tool.call_completed"
  | "agent.tool.call_failed"
  | "agent.approval.requested"
  | "agent.approval.responded"
  | "agent.plan.created"
  | "agent.plan.step_completed"
  | "agent.message.added"
  | "agent.error";

export interface AgentEvent {
  type: AgentEventType;
  sessionId: string;
  timestamp: number;
  payload: unknown;
}
