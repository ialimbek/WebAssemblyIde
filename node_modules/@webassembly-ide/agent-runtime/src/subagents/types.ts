/**
 * SubAgent Type Definitions
 *
 * Core type system for the SubAgent architecture in WebAssemblyIde.
 * SubAgents are specialized, focused agent units that execute specific
 * tasks delegated by the main Agent Orchestrator.
 */

// ─── Permission Levels (aligned with ARCHITECTURE.md §10.1) ────────────────

export type PermissionLevel =
  | "observe" // read-only access
  | "suggest" // generate plans/diffs without applying
  | "edit" // apply workspace changes (with approval)
  | "execute" // run terminal/build/test commands (with approval)
  | "autonomous"; // limited automated execution within policy

export type RiskLevel = "low" | "medium" | "high";

// ─── SubAgent Role Definitions ──────────────────────────────────────────────

export type SubAgentRole =
  | "reader" // reads and analyzes files
  | "searcher" // searches code, symbols, patterns
  | "writer" // generates patches, writes files
  | "executor" // runs terminal commands, tests, builds
  | "reviewer" // reviews diffs, checks architecture, security
  | "planner" // decomposes tasks, creates execution plans
  | "context"; // gathers and ranks context from multiple sources

// ─── Tool Names (aligned with Tool Registry in ARCHITECTURE.md §6.2) ───────

export type ToolName =
  | "read_file"
  | "write_file"
  | "apply_patch"
  | "search_files"
  | "list_files"
  | "run_command"
  | "git_diff"
  | "run_tests"
  | "open_preview"
  | "reload_preview"
  | "collect_console_logs"
  | "collect_network_errors"
  | "capture_screenshot"
  | "scratchpad_execute"
  | "lsp_diagnostics"
  | "package_manager";

// ─── SubAgent Definition ────────────────────────────────────────────────────

export interface SubAgentDefinition {
  /** Unique identifier for this subagent type */
  id: string;
  /** Human-readable name */
  name: string;
  /** Role this subagent fulfills */
  role: SubAgentRole;
  /** Tools this subagent is allowed to use */
  allowedTools: ToolName[];
  /** Maximum permission level this subagent can operate at */
  permissionLevel: PermissionLevel;
  /** Maximum context tokens this subagent can consume */
  maxContextTokens: number;
  /** Timeout in milliseconds for a single task execution */
  timeoutMs: number;
  /** Whether this subagent can run in parallel with others */
  supportsParallel: boolean;
  /** Optional description of the subagent's purpose */
  description?: string;
}

// ─── Task Input / Output ────────────────────────────────────────────────────

export interface SubAgentTask {
  /** Unique task instance ID */
  id: string;
  /** Reference to the subagent definition that should handle this */
  subAgentId: string;
  /** The task prompt / instruction */
  instruction: string;
  /** Context data relevant to this task */
  context: SubAgentContext;
  /** Priority (higher = more urgent) */
  priority: number;
  /** Parent task ID if this is a subtask of a larger operation */
  parentTaskId?: string;
  /** Timestamp when task was created */
  createdAt: number;
}

export interface SubAgentContext {
  /** Relevant file paths for this task */
  filePaths?: string[];
  /** File contents (keyed by path) */
  fileContents?: Record<string, string>;
  /** Workspace root path */
  workspaceRoot?: string;
  /** Additional context data as key-value pairs */
  metadata?: Record<string, unknown>;
  /** Previous task results that may be relevant */
  priorResults?: SubAgentResult[];
}

// ─── SubAgent Result ────────────────────────────────────────────────────────

export type SubAgentResultStatus =
  | "success"
  | "partial"
  | "failed"
  | "timeout"
  | "cancelled";

export interface SubAgentResult {
  /** Task ID this result corresponds to */
  taskId: string;
  /** SubAgent that produced this result */
  subAgentId: string;
  /** Result status */
  status: SubAgentResultStatus;
  /** Output text / summary */
  output: string;
  /** Structured data produced by the subagent */
  data?: SubAgentResultData;
  /** Error information if status is failed */
  error?: SubAgentError;
  /** Tool calls made during execution */
  toolCalls?: ToolCallRecord[];
  /** Token usage for this task */
  tokenUsage?: TokenUsage;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Timestamp when result was produced */
  completedAt: number;
}

export interface SubAgentResultData {
  /** Files that were read */
  filesRead?: string[];
  /** Files that were modified/created */
  filesChanged?: FileChange[];
  /** Patches generated */
  patches?: PatchInfo[];
  /** Search results */
  searchResults?: SearchResult[];
  /** Commands executed */
  commandsExecuted?: CommandResult[];
  /** Diagnostic findings */
  diagnostics?: DiagnosticInfo[];
  /** Structured findings (for reviewer subagent) */
  findings?: Finding[];
  /** Task decomposition (for planner subagent) */
  subtasks?: SubAgentTask[];
  /** Custom structured data */
  custom?: Record<string, unknown>;
}

// ─── Supporting Data Types ──────────────────────────────────────────────────

export interface FileChange {
  path: string;
  type: "create" | "modify" | "delete" | "rename";
  oldPath?: string; // for renames
  diff?: string;
}

export interface PatchInfo {
  filePath: string;
  unifiedDiff: string;
  description: string;
}

export interface SearchResult {
  filePath: string;
  lineNumber: number;
  column: number;
  matchText: string;
  contextBefore?: string;
  contextAfter?: string;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface DiagnosticInfo {
  filePath: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info" | "hint";
  message: string;
  source?: string;
  code?: string | number;
}

export interface Finding {
  category:
    | "security"
    | "architecture"
    | "performance"
    | "quality"
    | "test-coverage";
  severity: RiskLevel;
  description: string;
  filePath?: string;
  line?: number;
  suggestion?: string;
}

export interface ToolCallRecord {
  toolName: ToolName;
  input: Record<string, unknown>;
  outputSummary: string;
  success: boolean;
  durationMs: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ─── SubAgent Error ─────────────────────────────────────────────────────────

export interface SubAgentError {
  code: SubAgentErrorCode;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

export type SubAgentErrorCode =
  | "TIMEOUT"
  | "TOOL_NOT_ALLOWED"
  | "PERMISSION_DENIED"
  | "CONTEXT_OVERFLOW"
  | "PROVIDER_ERROR"
  | "INTERNAL_ERROR"
  | "CANCELLED";

// ─── SubAgent Event Types (for Event Bus integration) ───────────────────────

export type SubAgentEventType =
  | "subagent:task:started"
  | "subagent:task:completed"
  | "subagent:task:failed"
  | "subagent:task:cancelled"
  | "subagent:tool:called"
  | "subagent:approval:required"
  | "subagent:progress:updated";

export interface SubAgentEvent {
  type: SubAgentEventType;
  taskId: string;
  subAgentId: string;
  timestamp: number;
  payload: unknown;
}
