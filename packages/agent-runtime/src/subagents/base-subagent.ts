/**
 * Base SubAgent
 *
 * Abstract base class for all SubAgents. Provides the execution lifecycle,
 * tool permission enforcement, timeout management, and event emission hooks.
 *
 * Each concrete SubAgent (Reader, Searcher, Writer, Executor, Reviewer, etc.)
 * extends this class and implements the `execute()` method.
 */

import type {
  SubAgentDefinition,
  SubAgentTask,
  SubAgentResult,
  SubAgentResultStatus,
  SubAgentContext,
  SubAgentError,
  SubAgentErrorCode,
  SubAgentEvent,
  SubAgentEventType,
  ToolName,
  ToolCallRecord,
} from "./types.js";

// ─── Tool Executor Interface ────────────────────────────────────────────────

/**
 * Interface for executing tools. The SubAgent does not directly access
 * the filesystem, terminal, or any system resource. All operations go
 * through this ToolExecutor, which delegates to the Tool Registry.
 *
 * This enforces the architecture rule: "Agent Runtime must not directly
 * manipulate workspace files/terminal/browser/scratchpad; all actions
 * go through the Tool Registry."
 */
export interface ToolExecutor {
  executeTool(
    toolName: ToolName,
    input: Record<string, unknown>,
  ): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  data?: unknown;
  error?: string;
  durationMs: number;
}

// ─── Event Emitter Interface ────────────────────────────────────────────────

/**
 * Lightweight event emitter interface for SubAgent lifecycle events.
 * Connects to the Event Bus in the full architecture.
 */
export interface SubAgentEventEmitter {
  emit(event: SubAgentEvent): void;
}

// ─── Approval Handler Interface ─────────────────────────────────────────────

/**
 * Handles approval requests for medium/high risk operations.
 * The SubAgent calls this when it needs user confirmation before
 * executing a potentially risky action.
 */
export interface ApprovalHandler {
  requestApproval(
    taskId: string,
    action: string,
    details: string,
  ): Promise<boolean>;
}

// ─── Base SubAgent Abstract Class ───────────────────────────────────────────

export abstract class BaseSubAgent {
  protected readonly definition: SubAgentDefinition;
  protected readonly toolExecutor: ToolExecutor;
  protected readonly eventEmitter?: SubAgentEventEmitter;
  protected readonly approvalHandler?: ApprovalHandler;

  constructor(
    definition: SubAgentDefinition,
    toolExecutor: ToolExecutor,
    eventEmitter?: SubAgentEventEmitter,
    approvalHandler?: ApprovalHandler,
  ) {
    this.definition = definition;
    this.toolExecutor = toolExecutor;
    this.eventEmitter = eventEmitter;
    this.approvalHandler = approvalHandler;
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /** Get the definition of this subagent */
  getDefinition(): SubAgentDefinition {
    return this.definition;
  }

  /** Get the role of this subagent */
  getRole() {
    return this.definition.role;
  }

  /** Get the unique ID of this subagent */
  getId(): string {
    return this.definition.id;
  }

  /**
   * Execute a task. This is the main entry point.
   * Handles lifecycle events, timeout, and error handling.
   * Delegates actual work to the abstract `execute()` method.
   */
  async run(task: SubAgentTask): Promise<SubAgentResult> {
    const startTime = Date.now();

    // Emit task started event
    this.emitEvent("subagent:task:started", task.id, null);

    try {
      // Validate the task is appropriate for this subagent
      this.validateTask(task);

      // Execute with timeout
      const result = await this.executeWithTimeout(task);

      // Emit completion event
      this.emitEvent(
        result.status === "success"
          ? "subagent:task:completed"
          : "subagent:task:failed",
        task.id,
        result,
      );

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const agentError = this.normalizeError(error);

      const result: SubAgentResult = {
        taskId: task.id,
        subAgentId: this.definition.id,
        status: "failed",
        output: `SubAgent execution failed: ${agentError.message}`,
        error: agentError,
        durationMs,
        completedAt: Date.now(),
      };

      this.emitEvent("subagent:task:failed", task.id, result);

      return result;
    }
  }

  /**
   * Cancel a running task (if supported by the concrete implementation).
   */
  async cancel(taskId: string): Promise<void> {
    this.emitEvent("subagent:task:cancelled", taskId, null);
  }

  // ─── Abstract Method (must be implemented by subclasses) ──────────────

  /**
   * Execute the actual task logic. Each SubAgent subclass implements this.
   *
   * @param task - The task to execute
   * @param tools - Tool executor for performing operations
   * @returns The result of the task execution
   */
  protected abstract execute(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
  ): Promise<SubAgentResult>;

  // ─── Protected Helpers ────────────────────────────────────────────────

  /**
   * Check if this subagent is allowed to use a specific tool.
   */
  protected isToolAllowed(toolName: ToolName): boolean {
    return this.definition.allowedTools.includes(toolName);
  }

  /**
   * Execute a tool with permission checking and audit logging.
   * This is the only way SubAgents should interact with external tools.
   */
  protected async callTool(
    toolName: ToolName,
    input: Record<string, unknown>,
    taskId: string,
  ): Promise<ToolExecutionResult> {
    // Check tool permission
    if (!this.isToolAllowed(toolName)) {
      const error: SubAgentError = {
        code: "TOOL_NOT_ALLOWED",
        message: `SubAgent "${this.definition.id}" is not allowed to use tool "${toolName}". Allowed tools: [${this.definition.allowedTools.join(", ")}]`,
        recoverable: false,
      };
      throw error;
    }

    const startTime = Date.now();

    try {
      const result = await this.toolExecutor.executeTool(toolName, input);

      // Emit tool call event for audit logging
      this.emitEvent("subagent:tool:called", taskId, {
        toolName,
        input,
        success: result.success,
        durationMs: result.durationMs,
      });

      return result;
    } catch (error) {
      this.emitEvent("subagent:tool:called", taskId, {
        toolName,
        input,
        success: false,
        durationMs: Date.now() - startTime,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Request user approval for a medium/high risk action.
   */
  protected async requestApproval(
    taskId: string,
    action: string,
    details: string,
  ): Promise<boolean> {
    if (!this.approvalHandler) {
      // If no approval handler, deny by default for safety
      return false;
    }

    this.emitEvent("subagent:approval:required", taskId, {
      action,
      details,
    });

    return this.approvalHandler.requestApproval(taskId, action, details);
  }

  // ─── Private Implementation ──────────────────────────────────────────

  /**
   * Validate that a task can be handled by this subagent.
   */
  private validateTask(task: SubAgentTask): void {
    if (task.subAgentId !== this.definition.id) {
      throw {
        code: "INTERNAL_ERROR",
        message: `Task ${task.id} is assigned to subagent "${task.subAgentId}" but this is "${this.definition.id}"`,
        recoverable: false,
      } as SubAgentError;
    }
  }

  /**
   * Execute the task with a timeout guard.
   */
  private async executeWithTimeout(
    task: SubAgentTask,
  ): Promise<SubAgentResult> {
    const timeoutMs = this.definition.timeoutMs;

    // Create a tool proxy for this execution context
    const toolProxy = new SubAgentToolProxy(
      this.definition.allowedTools,
      (toolName, input) => this.callTool(toolName, input, task.id),
      this.approvalHandler
        ? (action, details) => this.requestApproval(task.id, action, details)
        : undefined,
    );

    // Race between execution and timeout
    return new Promise<SubAgentResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject({
          code: "TIMEOUT",
          message: `SubAgent "${this.definition.id}" timed out after ${timeoutMs}ms`,
          recoverable: true,
        } as SubAgentError);
      }, timeoutMs);

      this.execute(task, toolProxy)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Normalize any thrown value into a SubAgentError.
   */
  private normalizeError(error: unknown): SubAgentError {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error
    ) {
      return error as SubAgentError;
    }

    return {
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : String(error),
      details: error,
      recoverable: false,
    };
  }

  /**
   * Emit an event to the event bus (if connected).
   */
  private emitEvent(
    type: SubAgentEventType,
    taskId: string,
    payload: unknown,
  ): void {
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type,
        taskId,
        subAgentId: this.definition.id,
        timestamp: Date.now(),
        payload,
      });
    }
  }
}

// ─── SubAgent Tool Proxy ────────────────────────────────────────────────────

/**
 * A scoped tool proxy passed to the execute() method of each SubAgent.
 * Provides a clean API for tool execution with built-in permission checks
 * and approval workflows.
 *
 * This is the ONLY way a SubAgent's execute() method should interact
 * with external tools and system resources.
 */
export class SubAgentToolProxy {
  private readonly allowedTools: Set<ToolName>;
  private readonly toolCaller: (
    toolName: ToolName,
    input: Record<string, unknown>,
  ) => Promise<ToolExecutionResult>;
  private readonly approvalRequester?: (
    action: string,
    details: string,
  ) => Promise<boolean>;
  private readonly callLog: ToolCallRecord[] = [];

  constructor(
    allowedTools: ToolName[],
    toolCaller: (
      toolName: ToolName,
      input: Record<string, unknown>,
    ) => Promise<ToolExecutionResult>,
    approvalRequester?: (action: string, details: string) => Promise<boolean>,
  ) {
    this.allowedTools = new Set(allowedTools);
    this.toolCaller = toolCaller;
    this.approvalRequester = approvalRequester;
  }

  /**
   * Execute a tool with the given input.
   * Throws if the tool is not in the allowed list.
   */
  async call(
    toolName: ToolName,
    input: Record<string, unknown>,
  ): Promise<ToolExecutionResult> {
    if (!this.allowedTools.has(toolName)) {
      throw new Error(
        `Tool "${toolName}" is not allowed. Allowed: [${[...this.allowedTools].join(", ")}]`,
      );
    }

    const result = await this.toolCaller(toolName, input);

    // Log the call for audit
    this.callLog.push({
      toolName,
      input,
      outputSummary: result.output.substring(0, 200),
      success: result.success,
      durationMs: result.durationMs,
    });

    return result;
  }

  /**
   * Request user approval for an action.
   * Returns true if approved, false if denied.
   */
  async requestApproval(action: string, details: string): Promise<boolean> {
    if (!this.approvalRequester) {
      return false;
    }
    return this.approvalRequester(action, details);
  }

  /**
   * Get all tool calls made during this execution.
   * Used for audit logging.
   */
  getCallLog(): ToolCallRecord[] {
    return [...this.callLog];
  }

  /**
   * Check if a specific tool is available to this proxy.
   */
  hasTool(toolName: ToolName): boolean {
    return this.allowedTools.has(toolName);
  }

  /**
   * Get list of available tools.
   */
  getAvailableTools(): ToolName[] {
    return [...this.allowedTools];
  }
}
