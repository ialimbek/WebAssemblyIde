/**
 * Planner SubAgent
 *
 * Specialized SubAgent for decomposing tasks into subtasks, creating
 * execution plans, and analyzing risks and affected modules.
 *
 * Permission Level: observe (read-only, planning only)
 * Risk Level: low
 */

import {
  BaseSubAgent,
  SubAgentToolProxy,
  type ToolExecutor,
  type SubAgentEventEmitter,
  type ApprovalHandler,
} from "./base-subagent.js";
import type {
  SubAgentDefinition,
  SubAgentTask,
  SubAgentResult,
  PlanStep,
  ExecutionPlan,
} from "./types.js";

// ─── Planner SubAgent Definition ────────────────────────────────────────────

export const PLANNER_SUBAGENT_DEFINITION: SubAgentDefinition = {
  id: "planner",
  name: "Task Planner",
  role: "planner",
  allowedTools: ["read_file", "search_files", "list_files"],
  permissionLevel: "observe",
  maxContextTokens: 40_000,
  timeoutMs: 60_000,
  supportsParallel: false,
  description:
    "Decomposes complex tasks into subtasks, creates execution plans, and identifies affected modules and risks.",
};

// PlanStep and ExecutionPlan are re-exported from types.ts for convenience
export type { PlanStep, ExecutionPlan } from "./types.js";

// ─── Planner SubAgent Implementation ────────────────────────────────────────

export class PlannerSubAgent extends BaseSubAgent {
  constructor(
    toolExecutor: ToolExecutor,
    eventEmitter?: SubAgentEventEmitter,
    approvalHandler?: ApprovalHandler,
  ) {
    super(
      PLANNER_SUBAGENT_DEFINITION,
      toolExecutor,
      eventEmitter,
      approvalHandler,
    );
  }

  protected async execute(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
  ): Promise<SubAgentResult> {
    const startTime = Date.now();

    const planType = task.context.metadata?.planType as string;
    const goal = task.context.metadata?.goal as string;

    if (!goal) {
      return {
        taskId: task.id,
        subAgentId: this.definition.id,
        status: "failed",
        output: "Missing required 'goal' in task context metadata.",
        error: {
          code: "INTERNAL_ERROR",
          message: "Missing 'goal' in task context metadata",
          recoverable: false,
        },
        durationMs: Date.now() - startTime,
        completedAt: Date.now(),
      };
    }

    switch (planType) {
      case "bug_fix":
        return this.handleBugFixPlan(task, tools, startTime, goal);
      case "feature":
        return this.handleFeaturePlan(task, tools, startTime, goal);
      case "refactor":
        return this.handleRefactorPlan(task, tools, startTime, goal);
      default:
        return this.handleGenericPlan(task, tools, startTime, goal);
    }
  }

  // ─── Plan Handlers ───────────────────────────────────────────────────

  /**
   * Create a plan for fixing a bug.
   * Steps: locate → understand → fix → test → review
   */
  private async handleBugFixPlan(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
    goal: string,
  ): Promise<SubAgentResult> {
    const affectedFiles = task.context.filePaths ?? [];
    const steps: PlanStep[] = [
      {
        order: 1,
        targetRole: "searcher",
        description:
          "Locate the bug — search for relevant code patterns and error sources",
        instruction: `Search for code related to: ${goal}`,
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 30_000,
        dependencies: [],
      },
      {
        order: 2,
        targetRole: "reader",
        description: "Read and understand the affected files and their context",
        instruction:
          "Read all files identified in step 1 to understand the full context",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 15_000,
        dependencies: [1],
      },
      {
        order: 3,
        targetRole: "writer",
        description: "Implement the fix — modify the affected code",
        instruction: `Apply the fix for: ${goal}`,
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 30_000,
        dependencies: [2],
        affectedFiles,
      },
      {
        order: 4,
        targetRole: "executor",
        description: "Run tests to verify the fix works",
        instruction: "Run the test suite to verify the fix",
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 60_000,
        dependencies: [3],
      },
      {
        order: 5,
        targetRole: "reviewer",
        description: "Review the changes for quality and security",
        instruction:
          "Review all changes made in step 3 for security, quality, and architecture compliance",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 30_000,
        dependencies: [3],
      },
    ];

    return this.buildPlanResult(task.id, goal, steps, startTime, tools);
  }

  /**
   * Create a plan for implementing a feature.
   * Steps: explore → design → implement → test → review
   */
  private async handleFeaturePlan(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
    goal: string,
  ): Promise<SubAgentResult> {
    const steps: PlanStep[] = [
      {
        order: 1,
        targetRole: "searcher",
        description:
          "Explore the codebase to understand existing patterns and find integration points",
        instruction: `Search for existing patterns related to: ${goal}`,
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 45_000,
        dependencies: [],
      },
      {
        order: 2,
        targetRole: "reader",
        description:
          "Read existing modules that will be affected or serve as reference",
        instruction:
          "Read all relevant files to understand architecture and patterns",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 20_000,
        dependencies: [1],
      },
      {
        order: 3,
        targetRole: "writer",
        description:
          "Implement the feature — create new files and modify existing ones",
        instruction: `Implement: ${goal}`,
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 120_000,
        dependencies: [2],
      },
      {
        order: 4,
        targetRole: "executor",
        description: "Run build and tests to verify the feature works",
        instruction: "Build the project and run tests",
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 90_000,
        dependencies: [3],
      },
      {
        order: 5,
        targetRole: "reviewer",
        description:
          "Review the feature implementation for quality and compliance",
        instruction: "Full review of all changes",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 45_000,
        dependencies: [3],
      },
    ];

    return this.buildPlanResult(task.id, goal, steps, startTime, tools);
  }

  /**
   * Create a plan for refactoring code.
   * Steps: analyze → plan → refactor → test → review
   */
  private async handleRefactorPlan(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
    goal: string,
  ): Promise<SubAgentResult> {
    const steps: PlanStep[] = [
      {
        order: 1,
        targetRole: "reader",
        description:
          "Analyze the current code structure and identify refactoring targets",
        instruction: `Analyze code related to: ${goal}`,
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 30_000,
        dependencies: [],
      },
      {
        order: 2,
        targetRole: "reviewer",
        description:
          "Review architecture and identify potential risks in the refactor",
        instruction: "Architecture review of the area to be refactored",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 30_000,
        dependencies: [1],
      },
      {
        order: 3,
        targetRole: "writer",
        description: "Apply refactoring changes step by step",
        instruction: `Refactor: ${goal}`,
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 120_000,
        dependencies: [2],
      },
      {
        order: 4,
        targetRole: "executor",
        description: "Run full test suite to ensure nothing is broken",
        instruction: "Run all tests",
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 90_000,
        dependencies: [3],
      },
      {
        order: 5,
        targetRole: "reviewer",
        description: "Final review of refactored code",
        instruction: "Full review of all refactored code",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 45_000,
        dependencies: [3, 4],
      },
    ];

    return this.buildPlanResult(task.id, goal, steps, startTime, tools);
  }

  /**
   * Create a generic plan for an unspecified task type.
   */
  private async handleGenericPlan(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
    goal: string,
  ): Promise<SubAgentResult> {
    // Gather context by reading specified files
    const filePaths = task.context.filePaths ?? [];

    if (filePaths.length > 0) {
      // Read files to understand context better
      for (const filePath of filePaths) {
        try {
          await tools.call("read_file", { path: filePath });
        } catch {
          // Best effort — continue even if a file can't be read
        }
      }
    }

    const steps: PlanStep[] = [
      {
        order: 1,
        targetRole: "searcher",
        description:
          "Explore and understand the relevant parts of the codebase",
        instruction: `Find all code related to: ${goal}`,
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 30_000,
        dependencies: [],
      },
      {
        order: 2,
        targetRole: "reader",
        description: "Read the identified files for full context",
        instruction: "Read files from step 1",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 20_000,
        dependencies: [1],
      },
      {
        order: 3,
        targetRole: "writer",
        description: "Implement the required changes",
        instruction: `Implement changes for: ${goal}`,
        requiresApproval: true,
        riskLevel: "medium",
        estimatedDurationMs: 60_000,
        dependencies: [2],
      },
      {
        order: 4,
        targetRole: "reviewer",
        description: "Review the changes",
        instruction: "Review all changes for quality and correctness",
        requiresApproval: false,
        riskLevel: "low",
        estimatedDurationMs: 30_000,
        dependencies: [3],
      },
    ];

    return this.buildPlanResult(task.id, goal, steps, startTime, tools);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  /**
   * Build a structured plan result from steps.
   */
  private buildPlanResult(
    taskId: string,
    goal: string,
    steps: PlanStep[],
    startTime: number,
    tools: SubAgentToolProxy,
  ): SubAgentResult {
    const allAffectedFiles = new Set<string>();
    const risks: string[] = [];
    let hasHighRisk = false;

    for (const step of steps) {
      if (step.affectedFiles) {
        for (const file of step.affectedFiles) {
          allAffectedFiles.add(file);
        }
      }
      if (step.riskLevel === "high") {
        hasHighRisk = true;
      }
      if (step.requiresApproval) {
        risks.push(
          `Step ${step.order}: ${step.description} — requires approval`,
        );
      }
    }

    const plan: ExecutionPlan = {
      summary: `Plan to accomplish: ${goal}`,
      steps,
      overallRisk: hasHighRisk
        ? "high"
        : steps.some((s) => s.riskLevel === "medium")
          ? "medium"
          : "low",
      estimatedTotalDurationMs: steps.reduce(
        (sum, s) => sum + s.estimatedDurationMs,
        0,
      ),
      allAffectedFiles: [...allAffectedFiles],
      risks,
    };

    const output = this.formatPlan(plan);

    return {
      taskId,
      subAgentId: this.definition.id,
      status: "success",
      output,
      data: {
        subtasks: steps.map((step) => ({
          id: `${taskId}-step-${step.order}`,
          subAgentId: step.targetRole,
          instruction: step.instruction,
          context: {
            filePaths: step.affectedFiles,
            metadata: {
              planStep: step.order,
              requiresApproval: step.requiresApproval,
              riskLevel: step.riskLevel,
            },
          },
          priority: steps.length - step.order, // higher priority for later steps
          parentTaskId: taskId,
          createdAt: Date.now(),
        })),
        custom: { plan },
      },
      toolCalls: tools.getCallLog(),
      durationMs: Date.now() - startTime,
      completedAt: Date.now(),
    };
  }

  /**
   * Format a plan into a human-readable string.
   */
  private formatPlan(plan: ExecutionPlan): string {
    const lines: string[] = [];
    lines.push(`📋 ${plan.summary}`);
    lines.push(`Risk: ${plan.overallRisk.toUpperCase()}`);
    lines.push(
      `Est. duration: ${Math.round(plan.estimatedTotalDurationMs / 1000)}s`,
    );
    lines.push(`Affected files: ${plan.allAffectedFiles.length}`);
    lines.push("");
    lines.push("Steps:");

    for (const step of plan.steps) {
      const approval = step.requiresApproval ? " ⚠️ [APPROVAL REQUIRED]" : "";
      const risk =
        step.riskLevel === "high"
          ? " 🔴"
          : step.riskLevel === "medium"
            ? " 🟡"
            : " 🟢";
      lines.push(
        `  ${step.order}. [${step.targetRole}]${risk} ${step.description}${approval}`,
      );

      if (step.dependencies.length > 0) {
        lines.push(`     ↳ depends on: step ${step.dependencies.join(", ")}`);
      }
    }

    if (plan.risks.length > 0) {
      lines.push("");
      lines.push("Risks & Considerations:");
      for (const risk of plan.risks) {
        lines.push(`  ⚠️ ${risk}`);
      }
    }

    return lines.join("\n");
  }
}
