/**
 * Base SubAgent
 *
 * Abstract base class for all SubAgents. Provides the execution lifecycle,
 * tool permission enforcement, timeout management, and event emission hooks.
 *
 * Each concrete SubAgent (Reader, Searcher, Writer, Executor, Reviewer, etc.)
 * extends this class and implements the `execute()` method.
 */
import type { SubAgentDefinition, SubAgentTask, SubAgentResult, SubAgentEvent, ToolName, ToolCallRecord } from "./types.js";
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
    executeTool(toolName: ToolName, input: Record<string, unknown>): Promise<ToolExecutionResult>;
}
export interface ToolExecutionResult {
    success: boolean;
    output: string;
    data?: unknown;
    error?: string;
    durationMs: number;
}
/**
 * Lightweight event emitter interface for SubAgent lifecycle events.
 * Connects to the Event Bus in the full architecture.
 */
export interface SubAgentEventEmitter {
    emit(event: SubAgentEvent): void;
}
/**
 * Handles approval requests for medium/high risk operations.
 * The SubAgent calls this when it needs user confirmation before
 * executing a potentially risky action.
 */
export interface ApprovalHandler {
    requestApproval(taskId: string, action: string, details: string): Promise<boolean>;
}
export declare abstract class BaseSubAgent {
    protected readonly definition: SubAgentDefinition;
    protected readonly toolExecutor: ToolExecutor;
    protected readonly eventEmitter?: SubAgentEventEmitter;
    protected readonly approvalHandler?: ApprovalHandler;
    constructor(definition: SubAgentDefinition, toolExecutor: ToolExecutor, eventEmitter?: SubAgentEventEmitter, approvalHandler?: ApprovalHandler);
    /** Get the definition of this subagent */
    getDefinition(): SubAgentDefinition;
    /** Get the role of this subagent */
    getRole(): import("./types.js").SubAgentRole;
    /** Get the unique ID of this subagent */
    getId(): string;
    /**
     * Execute a task. This is the main entry point.
     * Handles lifecycle events, timeout, and error handling.
     * Delegates actual work to the abstract `execute()` method.
     */
    run(task: SubAgentTask): Promise<SubAgentResult>;
    /**
     * Cancel a running task (if supported by the concrete implementation).
     */
    cancel(taskId: string): Promise<void>;
    /**
     * Execute the actual task logic. Each SubAgent subclass implements this.
     *
     * @param task - The task to execute
     * @param tools - Tool executor for performing operations
     * @returns The result of the task execution
     */
    protected abstract execute(task: SubAgentTask, tools: SubAgentToolProxy): Promise<SubAgentResult>;
    /**
     * Check if this subagent is allowed to use a specific tool.
     */
    protected isToolAllowed(toolName: ToolName): boolean;
    /**
     * Execute a tool with permission checking and audit logging.
     * This is the only way SubAgents should interact with external tools.
     */
    protected callTool(toolName: ToolName, input: Record<string, unknown>, taskId: string): Promise<ToolExecutionResult>;
    /**
     * Request user approval for a medium/high risk action.
     */
    protected requestApproval(taskId: string, action: string, details: string): Promise<boolean>;
    /**
     * Validate that a task can be handled by this subagent.
     */
    private validateTask;
    /**
     * Execute the task with a timeout guard.
     */
    private executeWithTimeout;
    /**
     * Normalize any thrown value into a SubAgentError.
     */
    private normalizeError;
    /**
     * Emit an event to the event bus (if connected).
     */
    private emitEvent;
}
/**
 * A scoped tool proxy passed to the execute() method of each SubAgent.
 * Provides a clean API for tool execution with built-in permission checks
 * and approval workflows.
 *
 * This is the ONLY way a SubAgent's execute() method should interact
 * with external tools and system resources.
 */
export declare class SubAgentToolProxy {
    private readonly allowedTools;
    private readonly toolCaller;
    private readonly approvalRequester?;
    private readonly callLog;
    constructor(allowedTools: ToolName[], toolCaller: (toolName: ToolName, input: Record<string, unknown>) => Promise<ToolExecutionResult>, approvalRequester?: (action: string, details: string) => Promise<boolean>);
    /**
     * Execute a tool with the given input.
     * Throws if the tool is not in the allowed list.
     */
    call(toolName: ToolName, input: Record<string, unknown>): Promise<ToolExecutionResult>;
    /**
     * Request user approval for an action.
     * Returns true if approved, false if denied.
     */
    requestApproval(action: string, details: string): Promise<boolean>;
    /**
     * Get all tool calls made during this execution.
     * Used for audit logging.
     */
    getCallLog(): ToolCallRecord[];
    /**
     * Check if a specific tool is available to this proxy.
     */
    hasTool(toolName: ToolName): boolean;
    /**
     * Get list of available tools.
     */
    getAvailableTools(): ToolName[];
}
//# sourceMappingURL=base-subagent.d.ts.map