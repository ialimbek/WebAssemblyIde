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
import { ReaderSubAgent, READER_SUBAGENT_DEFINITION, } from "./reader-subagent.js";
import { SearcherSubAgent, SEARCHER_SUBAGENT_DEFINITION, } from "./searcher-subagent.js";
import { WriterSubAgent, WRITER_SUBAGENT_DEFINITION, } from "./writer-subagent.js";
import { ExecutorSubAgent, EXECUTOR_SUBAGENT_DEFINITION, } from "./executor-subagent.js";
import { ReviewerSubAgent, REVIEWER_SUBAGENT_DEFINITION, } from "./reviewer-subagent.js";
import { PlannerSubAgent, PLANNER_SUBAGENT_DEFINITION, } from "./planner-subagent.js";
// ─── SubAgent Orchestrator ──────────────────────────────────────────────────
export class SubAgentOrchestrator {
    subAgents;
    config;
    eventEmitter;
    toolExecutor;
    approvalHandler;
    constructor(toolExecutor, config, eventEmitter, approvalHandler) {
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
    async orchestrate(request) {
        const startTime = Date.now();
        const allResults = [];
        const errors = [];
        try {
            let results;
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
        }
        catch (error) {
            errors.push(String(error));
        }
        // Collect errors from failed results
        for (const result of allResults) {
            if (result.status === "failed" && result.error) {
                errors.push(`[${result.subAgentId}] ${result.error.message}`);
            }
        }
        const totalToolCalls = allResults.reduce((sum, r) => sum + (r.toolCalls?.length ?? 0), 0);
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
    registerSubAgent(subAgent) {
        this.subAgents.set(subAgent.getId(), subAgent);
    }
    /**
     * Get a SubAgent by its role.
     */
    getSubAgentByRole(role) {
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
    getRegisteredDefinitions() {
        return Array.from(this.subAgents.values()).map((sa) => sa.getDefinition());
    }
    // ─── Mode Executors ──────────────────────────────────────────────────
    /**
     * Plan mode: only observe-level SubAgents.
     * Planner creates the plan, Reader/Searcher gather context.
     */
    async executePlanMode(request) {
        const results = [];
        // Step 1: Use Planner to create an execution plan
        const planner = this.getSubAgentByRole("planner");
        if (planner) {
            const planResult = await planner.run(this.createTask(planner.getId(), `Create a plan for: ${request.goal}`, request, 10));
            results.push(planResult);
        }
        // Step 2: Use Searcher to find relevant files (if no files specified)
        if (!request.filePaths?.length) {
            const searcher = this.getSubAgentByRole("searcher");
            if (searcher) {
                const searchResult = await searcher.run(this.createTask(searcher.getId(), `Search for code related to: ${request.goal}`, {
                    ...request,
                    metadata: { ...request.metadata, pattern: request.goal },
                }, 9));
                results.push(searchResult);
            }
        }
        return results;
    }
    /**
     * Act mode: execute a pre-defined plan sequentially.
     * Each step runs the appropriate SubAgent based on its role.
     */
    async executeActMode(request) {
        const results = [];
        // If subtasks are provided in metadata, execute them in order
        const subtasks = request.metadata?.subtasks;
        if (subtasks && subtasks.length > 0) {
            // Execute subtasks respecting dependencies
            const completed = new Set();
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
        }
        else {
            // No subtasks provided — use a default sequential flow
            // Read → Search → (Report back — actual writing needs plan)
            const reader = this.getSubAgentByRole("reader");
            if (reader && request.filePaths?.length) {
                const readResult = await reader.run(this.createTask(reader.getId(), `Read files: ${request.filePaths.join(", ")}`, request, 5));
                results.push(readResult);
            }
        }
        return results;
    }
    /**
     * Review mode: read files, search patterns, and review.
     */
    async executeReviewMode(request) {
        const results = [];
        // Step 1: Reviewer
        const reviewer = this.getSubAgentByRole("reviewer");
        if (reviewer) {
            const reviewResult = await reviewer.run(this.createTask(reviewer.getId(), `Review: ${request.goal}`, {
                ...request,
                metadata: {
                    ...request.metadata,
                    reviewType: request.metadata?.reviewType ?? "full",
                },
            }, 10));
            results.push(reviewResult);
        }
        return results;
    }
    /**
     * Autonomous mode: Planner creates plan, then execute each step.
     * Combines plan + act modes.
     */
    async executeAutonomousMode(request) {
        const results = [];
        // Step 1: Plan
        const planner = this.getSubAgentByRole("planner");
        if (planner) {
            const planResult = await planner.run(this.createTask(planner.getId(), `Create a plan for: ${request.goal}`, {
                ...request,
                metadata: {
                    ...request.metadata,
                    planType: request.metadata?.planType ?? "generic",
                    goal: request.goal,
                },
            }, 10));
            results.push(planResult);
            // Extract subtasks from the plan
            const subtasks = planResult.data?.subtasks;
            if (subtasks && subtasks.length > 0) {
                // Step 2: Execute each planned step
                for (const subtask of subtasks) {
                    const subAgent = this.subAgents.get(subtask.subAgentId);
                    if (!subAgent)
                        continue;
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
    registerDefaultSubAgents() {
        const defaults = [
            {
                id: READER_SUBAGENT_DEFINITION.id,
                Class: ReaderSubAgent,
            },
            {
                id: SEARCHER_SUBAGENT_DEFINITION.id,
                Class: SearcherSubAgent,
            },
            {
                id: WRITER_SUBAGENT_DEFINITION.id,
                Class: WriterSubAgent,
            },
            {
                id: EXECUTOR_SUBAGENT_DEFINITION.id,
                Class: ExecutorSubAgent,
            },
            {
                id: REVIEWER_SUBAGENT_DEFINITION.id,
                Class: ReviewerSubAgent,
            },
            {
                id: PLANNER_SUBAGENT_DEFINITION.id,
                Class: PlannerSubAgent,
            },
        ];
        for (const { Class: SubAgentClass } of defaults) {
            const instance = new SubAgentClass(this.toolExecutor, this.eventEmitter, this.approvalHandler);
            this.subAgents.set(instance.getId(), instance);
        }
    }
    /**
     * Create a SubAgentTask from an orchestration request.
     */
    createTask(subAgentId, instruction, request, priority) {
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
    determineOverallStatus(results) {
        if (results.length === 0)
            return "failed";
        const hasFailures = results.some((r) => r.status === "failed");
        const allSuccess = results.every((r) => r.status === "success");
        if (allSuccess)
            return "success";
        if (hasFailures && results.some((r) => r.status === "success"))
            return "partial";
        if (results.some((r) => r.status === "cancelled"))
            return "cancelled";
        return "failed";
    }
    /**
     * Build a human-readable summary of the orchestration.
     */
    buildSummary(request, results) {
        const lines = [];
        lines.push(`Goal: ${request.goal}`);
        lines.push(`Mode: ${request.mode}`);
        lines.push(`Steps completed: ${results.length}`);
        lines.push("");
        for (const result of results) {
            const icon = result.status === "success"
                ? "✅"
                : result.status === "failed"
                    ? "❌"
                    : "⚠️";
            lines.push(`${icon} [${result.subAgentId}] ${result.output.substring(0, 150)}`);
        }
        return lines.join("\n");
    }
}
//# sourceMappingURL=orchestrator.js.map