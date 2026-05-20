/**
 * SubAgent Orchestrator
 *
 * The central coordinator that manages SubAgent lifecycle, dispatches tasks,
 * collects results, handles parallel/sequential execution, and merges outputs.
 *
 * This is the main entry point for the Agent Runtime to use SubAgents.
 * It receives high-level tasks from the Plan/Act Mode Orchestrators and
 * breaks them down into SubAgent-executable units.
 *
 * Architecture alignment:
 * - Communicates through Command Bus / Event Bus
 * - SubAgents access tools only through Tool Registry
 * - Approval workflow enforced at every medium/high risk operation
 * - All actions are audit-logged
 */

import {
  BaseSubAgent,
  type ToolExecutor,
  type SubAgentEventEmitter,
  type ApprovalHandler,
} from "./base-subagent.js";
import type {
  SubAgentDefinition,
  SubAgentTask,
  SubAgentResult,
  SubAgentRole,
  SubAgentEvent,
} from "./types.js";
import {
  ReaderSubAgent,
  READER_SUBAGENT_DEFINITION,
} from "./reader-subagent.js";
import {
  SearcherSubAgent,
  SEARCHER_SUBAGENT_DEFINITION,
} from "./searcher-subagent.js";
import {
  WriterSubAgent,
  WRITER_SUBAGENT_DEFINITION,
} from "./writer-subagent.js";
import {
  ExecutorSubAgent,
  EXECUTOR_SUBAGENT_DEFINITION,
} from "./executor-subagent.js";
import {
  ReviewerSubAgent,
  REVIEWER_SUBAGENT_DEFINITION,
} from "./reviewer-subagent.js";
import {
  PlannerSubAgent,
  PLANNER_SUBAGENT_DEFINITION,
} from "./planner-subagent.js";

// ─── Orchestrator Types ─────────────────────────────────────────────────────

export interface OrchestratorConfig {
  /** Maximum number of SubAgents that can run concurrently */
  maxConcurrency: number;
  /** Default timeout for the entire orchestration */
  defaultTimeoutMs: number;
  /** Whether to stop execution on first failure */
  failFast: boolean;
}

export type OrchestratorMode = "plan" | "act" | "review" | "autonomous";

export interface OrchestrationRequest {
  /** Unique request ID */
  id: string;
  /** The high-level task description */
  goal: string;
  /** Mode determines execution strategy */
  mode: OrchestratorMode;
  /** Relevant files */
  filePaths?: string[];
  /** Workspace root */
  workspaceRoot?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface OrchestrationResult {
  /** Request ID */
  requestId: string;
  /** Overall status */
  status: "success" | "partial" | "failed" | "cancelled";
  /** Summary of what was accomplished */
  summary: string;
  /** All SubAgent results in execution order */
  results: SubAgentResult[];
  /** Total duration */
  totalDurationMs: number;
  /** Total tool calls made */
  totalToolCalls: number;
  /** Any errors encountered */
  errors: string[];
}

// ─── SubAgent Orchestrator ──────────────────────────────────────────────────

export class SubAgentOrchestrator {
  private readonly subAgents: Map<string, BaseSubAgent>;
  private readonly config: OrchestratorConfig;
  private readonly eventEmitter?: SubAgentEventEmitter;
  private readonly toolExecutor: ToolExecutor;
  private readonly approvalHandler?: ApprovalHandler;

  constructor(
    toolExecutor: ToolExecutor,
    config?: Partial<OrchestratorConfig>,
    eventEmitter?: SubAgentEventEmitter,
    approvalHandler?: ApprovalHandler,
  ) {
    this.toolExecutor = toolExecutor;
    this.eventEmitter = eventEmitter;
    this.approvalHandler = approvalHandler;
    this.config = {
      maxConcurrency: config?.maxConcurrency ?? 3,
      defaultTimeoutMs: config?.defaultTimeoutMs ?? 300_000, // 5 minutes
      failFast: config?.failFast ?? false,
    };

    // Initialize all SubAgent instances
    this.subAgents = new Map();
    this.registerDefaultSubAgents();
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /**
   * Orchestrate a task using SubAgents.
   * This is the main entry point.
   *
   * In "plan" mode: only uses Planner, Reader, Searcher
   * In "act" mode: uses all SubAgents sequentially following a plan
   * In "review" mode: uses Reviewer, Reader, Searcher
   * In "autonomous" mode: uses Planner first, then executes the plan
   */
  async orchestrate(
    request: OrchestrationRequest,
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const allResults: SubAgentResult[] = [];
    const errors: string[] = [];

    try {
      let results: SubAgentResult[];

      switch (request.mode) {
        case "plan":
          results = await this.executePlanMode(request);
          break;
        case "act":
          results = await this.executeActMode(request);
          break;
        case "review":
          results = await this.executeReviewMode(request);
          break;
        case "autonomous":
          results = await this.executeAutonomousMode(request);
          break;
        default:
          results = await this.executePlanMode(request);
      }

      allResults.push(...results);
    } catch (error) {
      errors.push(String(error));
    }

    // Collect errors from failed results
    for (const result of allResults) {
      if (result.status === "failed" && result.error) {
        errors.push(`[${result.subAgentId}] ${result.error.message}`);
      }
    }

    const totalToolCalls = allResults.reduce(
      (sum, r) => sum + (r.toolCalls?.length ?? 0),
      0,
    );

    const overallStatus = this.determineOverallStatus(allResults);

    return {
      requestId: request.id,
      status: overallStatus,
      summary: this.buildSummary(request, allResults),
      results: allResults,
      totalDurationMs: Date.now() - startTime,
      totalToolCalls,
      errors,
    };
  }

  /**
   * Register a custom SubAgent.
   */
  registerSubAgent(subAgent: BaseSubAgent): void {
    this.subAgents.set(subAgent.getId(), subAgent);
  }

  /**
   * Get a SubAgent by its role.
   */
  getSubAgentByRole(role: SubAgentRole): BaseSubAgent | undefined {
    for (const subAgent of this.subAgents.values()) {
      if (subAgent.getRole() === role) {
        return subAgent;
      }
    }
    return undefined;
  }

  /**
   * Get all registered SubAgent definitions.
   */
  getRegisteredDefinitions(): SubAgentDefinition[] {
    return Array.from(this.subAgents.values()).map((sa) => sa.getDefinition());
  }

  // ─── Mode Executors ──────────────────────────────────────────────────

  /**
   * Plan mode: only observe-level SubAgents.
   * Planner creates the plan, Reader/Searcher gather context.
   */
  private async executePlanMode(
    request: OrchestrationRequest,
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];

    // Step 1: Use Planner to create an execution plan
    const planner = this.getSubAgentByRole("planner");
    if (planner) {
      const planResult = await planner.run(
        this.createTask(
          planner.getId(),
          `Create a plan for: ${request.goal}`,
          request,
          10,
        ),
      );
      results.push(planResult);
    }

    // Step 2: Use Searcher to find relevant files (if no files specified)
    if (!request.filePaths?.length) {
      const searcher = this.getSubAgentByRole("searcher");
      if (searcher) {
        const searchResult = await searcher.run(
          this.createTask(
            searcher.getId(),
            `Search for code related to: ${request.goal}`,
            {
              ...request,
              metadata: { ...request.metadata, pattern: request.goal },
            },
            9,
          ),
        );
        results.push(searchResult);
      }
    }

    return results;
  }

  /**
   * Act mode: execute a pre-defined plan sequentially.
   * Each step runs the appropriate SubAgent based on its role.
   */
  private async executeActMode(
    request: OrchestrationRequest,
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];

    // If subtasks are provided in metadata, execute them in order
    const subtasks = request.metadata?.subtasks as SubAgentTask[] | undefined;

    if (subtasks && subtasks.length > 0) {
      // Execute subtasks respecting dependencies
      const completed = new Set<string>();

      // Simple sequential execution for now
      // TODO: Implement proper dependency graph execution
      for (const subtask of subtasks) {
        const subAgent = this.subAgents.get(subtask.subAgentId);
        if (!subAgent) {
          results.push({
            taskId: subtask.id,
            subAgentId: subtask.subAgentId,
            status: "failed",
            output: `No SubAgent registered with id "${subtask.subAgentId}"`,
            error: {
              code: "INTERNAL_ERROR",
              message: `SubAgent not found: ${subtask.subAgentId}`,
              recoverable: false,
            },
            durationMs: 0,
            completedAt: Date.now(),
          });
          continue;
        }

        const result = await subAgent.run(subtask);
        results.push(result);
        completed.add(subtask.id);

        // Stop on failure if failFast is enabled
        if (this.config.failFast && result.status === "failed") {
          break;
        }
      }
    } else {
      // No subtasks provided — use a default sequential flow
      // Read → Search → (Report back — actual writing needs plan)
      const reader = this.getSubAgentByRole("reader");
      if (reader && request.filePaths?.length) {
        const readResult = await reader.run(
          this.createTask(
            reader.getId(),
            `Read files: ${request.filePaths.join(", ")}`,
            request,
            5,
          ),
        );
        results.push(readResult);
      }
    }

    return results;
  }

  /**
   * Review mode: read files, search patterns, and review.
   */
  private async executeReviewMode(
    request: OrchestrationRequest,
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];

    // Step 1: Reviewer
    const reviewer = this.getSubAgentByRole("reviewer");
    if (reviewer) {
      const reviewResult = await reviewer.run(
        this.createTask(
          reviewer.getId(),
          `Review: ${request.goal}`,
          {
            ...request,
            metadata: {
              ...request.metadata,
              reviewType: request.metadata?.reviewType ?? "full",
            },
          },
          10,
        ),
      );
      results.push(reviewResult);
    }

    return results;
  }

  /**
   * Autonomous mode: Planner creates plan, then execute each step.
   * Combines plan + act modes.
   */
  private async executeAutonomousMode(
    request: OrchestrationRequest,
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = [];

    // Step 1: Plan
    const planner = this.getSubAgentByRole("planner");
    if (planner) {
      const planResult = await planner.run(
        this.createTask(
          planner.getId(),
          `Create a plan for: ${request.goal}`,
          {
            ...request,
            metadata: {
              ...request.metadata,
              planType: request.metadata?.planType ?? "generic",
              goal: request.goal,
            },
          },
          10,
        ),
      );
      results.push(planResult);

      // Extract subtasks from the plan
      const subtasks = planResult.data?.subtasks;

      if (subtasks && subtasks.length > 0) {
        // Step 2: Execute each planned step
        for (const subtask of subtasks) {
          const subAgent = this.subAgents.get(subtask.subAgentId);
          if (!subAgent) continue;

          const result = await subAgent.run(subtask);
          results.push(result);

          if (this.config.failFast && result.status === "failed") {
            break;
          }
        }
      }
    }

    return results;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  /**
   * Register the default set of SubAgents.
   */
  private registerDefaultSubAgents(): void {
    const defaults: Array<[string, new (...args: unknown[]) => BaseSubAgent]> =
      [
        [
          READER_SUBAGENT_DEFINITION.id,
          ReaderSubAgent as unknown as new (...args: unknown[]) => BaseSubAgent,
        ],
        [
          SEARCHER_SUBAGENT_DEFINITION.id,
          SearcherSubAgent as unknown as new (
            ...args: unknown[]
          ) => BaseSubAgent,
        ],
        [
          WRITER_SUBAGENT_DEFINITION.id,
          WriterSubAgent as unknown as new (...args: unknown[]) => BaseSubAgent,
        ],
        [
          EXECUTOR_SUBAGENT_DEFINITION.id,
          ExecutorSubAgent as unknown as new (
            ...args: unknown[]
          ) => BaseSubAgent,
        ],
        [
          REVIEWER_SUBAGENT_DEFINITION.id,
          ReviewerSubAgent as unknown as new (
            ...args: unknown[]
          ) => BaseSubAgent,
        ],
        [
          PLANNER_SUBAGENT_DEFINITION.id,
          PlannerSubAgent as unknown as new (
            ...args: unknown[]
          ) => BaseSubAgent,
        ],
      ];

    for (const [, SubAgentClass] of defaults) {
      const instance = new SubAgentClass(
        this.toolExecutor,
        this.eventEmitter,
        this.approvalHandler,
      );
      this.subAgents.set(instance.getId(), instance);
    }
  }

  /**
   * Create a SubAgentTask from an orchestration request.
   */
  private createTask(
    subAgentId: string,
    instruction: string,
    request: OrchestrationRequest,
    priority: number,
  ): SubAgentTask {
    return {
      id: `${request.id}-${subAgentId}-${Date.now()}`,
      subAgentId,
      instruction,
      context: {
        filePaths: request.filePaths,
        workspaceRoot: request.workspaceRoot,
        metadata: request.metadata,
      },
      priority,
      parentTaskId: request.id,
      createdAt: Date.now(),
    };
  }

  /**
   * Determine overall status from a set of results.
   */
  private determineOverallStatus(
    results: SubAgentResult[],
  ): OrchestrationResult["status"] {
    if (results.length === 0) return "failed";

    const hasFailures = results.some((r) => r.status === "failed");
    const allSuccess = results.every((r) => r.status === "success");

    if (allSuccess) return "success";
    if (hasFailures && results.some((r) => r.status === "success"))
      return "partial";
    if (results.some((r) => r.status === "cancelled")) return "cancelled";
    return "failed";
  }

  /**
   * Build a human-readable summary of the orchestration.
   */
  private buildSummary(
    request: OrchestrationRequest,
    results: SubAgentResult[],
  ): string {
    const lines: string[] = [];
    lines.push(`Goal: ${request.goal}`);
    lines.push(`Mode: ${request.mode}`);
    lines.push(`Steps completed: ${results.length}`);
    lines.push("");

    for (const result of results) {
      const icon =
        result.status === "success"
          ? "✅"
          : result.status === "failed"
            ? "❌"
            : "⚠️";
      lines.push(
        `${icon} [${result.subAgentId}] ${result.output.substring(0, 150)}`,
      );
    }

    return lines.join("\n");
  }
}
