/**
 * AgentOrchestrator — main agent loop that coordinates Chat, Plan, and Act modes.
 * Manages the lifecycle of agent operations: receive user intent → plan → execute → respond.
 * All tool interactions go through the Tool Registry (not direct module access).
 */

import { AgentSession } from "./agent-session";
import { ApprovalGuard } from "./approval-guard";
import { AuditLog } from "./audit-log";
import type {
  AgentContext,
  Plan,
  ToolCall,
  ToolResult,
  AgentEvent,
} from "./types";

type EventListener = (event: AgentEvent) => void;

/** Tool execution function — injected by Tool Registry. */
export type ToolExecutor = (
  toolName: string,
  args: Record<string, unknown>,
) => Promise<ToolResult>;

/** LLM completion function — injected by AI Gateway. */
export type LLMCompleter = (
  messages: Array<{ role: string; content: string }>,
  options?: { tools?: unknown[]; maxTokens?: number },
) => Promise<{ content: string; toolCalls?: ToolCall[] }>;

export interface OrchestratorConfig {
  session: AgentSession;
  toolExecutor: ToolExecutor;
  llmCompleter?: LLMCompleter;
  auditLog?: AuditLog;
  approvalGuard?: ApprovalGuard;
  maxRetries?: number;
}

export class AgentOrchestrator {
  private session: AgentSession;
  private toolExecutor: ToolExecutor;
  private llmCompleter?: LLMCompleter;
  private auditLog: AuditLog;
  private approvalGuard: ApprovalGuard;
  private listeners: EventListener[] = [];
  private maxRetries: number;
  private currentPlan?: Plan;
  private aborted = false;

  constructor(config: OrchestratorConfig) {
    this.session = config.session;
    this.toolExecutor = config.toolExecutor;
    this.llmCompleter = config.llmCompleter;
    this.auditLog = config.auditLog ?? new AuditLog();
    this.approvalGuard = config.approvalGuard ?? new ApprovalGuard();
    this.maxRetries = config.maxRetries ?? 3;
  }

  // ── Public API ──

  /** Process a user message based on current mode. */
  async processUserMessage(
    content: string,
    context?: AgentContext,
  ): Promise<void> {
    this.aborted = false;
    this.session.addUserMessage(content);
    this.session.setState("thinking");

    try {
      switch (this.session.getMode()) {
        case "chat":
          await this.processChat(context);
          break;
        case "plan":
          await this.processPlan(content, context);
          break;
        case "act":
          await this.processAct(content, context);
          break;
        case "review":
          await this.processReview(content, context);
          break;
        default:
          await this.processChat(context);
      }
    } catch (error) {
      this.session.setState("error");
      this.session.addAssistantMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Abort the current operation. */
  abort(): void {
    this.aborted = true;
    this.session.setState("idle");
  }

  /** Get the current plan (if in plan mode). */
  getCurrentPlan(): Plan | undefined {
    return this.currentPlan;
  }

  /** Approve a pending approval request. */
  approve(requestId: string): void {
    this.approvalGuard.respond(requestId, "approve");
  }

  /** Reject a pending approval request. */
  reject(requestId: string): void {
    this.approvalGuard.respond(requestId, "reject");
  }

  /** Approve all for current tool type. */
  approveAll(requestId: string): void {
    this.approvalGuard.respond(requestId, "approve_all");
  }

  /** Execute approved plan steps sequentially. */
  async executePlan(planId?: string): Promise<void> {
    const plan = this.currentPlan;
    if (!plan || (planId && plan.id !== planId)) {
      this.session.addAssistantMessage("No plan to execute.");
      return;
    }

    this.session.setState("executing");

    for (const step of plan.steps) {
      if (this.aborted) break;
      if (step.status !== "pending" && step.status !== "approved") continue;

      step.status = "executing";
      this.emit({
        type: "agent.plan.step_completed",
        sessionId: this.session.id,
        timestamp: Date.now(),
        payload: { stepId: step.id, status: "executing" },
      });

      try {
        for (const toolCall of step.toolCalls) {
          if (this.aborted) break;
          await this.executeToolCall(toolCall);
        }
        step.status = "completed";
      } catch (error) {
        step.status = "failed";
        step.result = {
          success: false,
          output: "",
          error: error instanceof Error ? error.message : String(error),
        };
      }

      this.emit({
        type: "agent.plan.step_completed",
        sessionId: this.session.id,
        timestamp: Date.now(),
        payload: { stepId: step.id, status: step.status },
      });
    }

    const completedSteps = plan.steps.filter(
      (s) => s.status === "completed",
    ).length;
    const failedSteps = plan.steps.filter((s) => s.status === "failed").length;

    this.session.addAssistantMessage(
      `Plan execution complete. ${completedSteps}/${plan.steps.length} steps succeeded, ${failedSteps} failed.`,
    );
    this.session.setState("completed");
  }

  // ── Mode processors ──

  private async processChat(_context?: AgentContext): Promise<void> {
    if (!this.llmCompleter) {
      this.session.addAssistantMessage(
        "Chat mode requires an LLM provider. Please configure an AI provider first.",
      );
      this.session.setState("completed");
      return;
    }

    const messages = this.session.toApiMessages();
    const response = await this.llmCompleter(messages);

    if (response.toolCalls && response.toolCalls.length > 0) {
      // In chat mode, we still allow tool calls but with observe-only permission
      for (const toolCall of response.toolCalls) {
        if (this.aborted) break;
        await this.executeToolCall(toolCall);
      }
    }

    this.session.addAssistantMessage(response.content, response.toolCalls);
    this.session.setState("idle");
  }

  private async processPlan(
    goal: string,
    context?: AgentContext,
  ): Promise<void> {
    if (!this.llmCompleter) {
      // Generate a mock plan for demonstration
      const plan: Plan = {
        id: `plan-${Date.now()}`,
        goal,
        steps: [
          {
            id: "step-1",
            order: 1,
            description: "Read and analyze workspace files",
            affectedFiles: context?.workspaceFiles.slice(0, 5) ?? [],
            riskLevel: "low",
            toolCalls: [],
            status: "pending",
          },
          {
            id: "step-2",
            order: 2,
            description: "Implement changes",
            affectedFiles: [],
            riskLevel: "medium",
            toolCalls: [],
            status: "pending",
          },
          {
            id: "step-3",
            order: 3,
            description: "Run tests and validate",
            affectedFiles: [],
            riskLevel: "medium",
            toolCalls: [],
            status: "pending",
          },
        ],
        risks: [
          "Changes may affect existing functionality",
          "Tests may need updating",
        ],
        estimatedToolCalls: 6,
        createdAt: Date.now(),
      };

      this.currentPlan = plan;
      this.session.addAssistantMessage(formatPlan(plan));
      this.emit({
        type: "agent.plan.created",
        sessionId: this.session.id,
        timestamp: Date.now(),
        payload: plan,
      });
      this.session.setState("idle");
      return;
    }

    const planPrompt = `You are in Plan Mode. Analyze the goal and produce a structured plan.
Goal: ${goal}
${context ? `\nWorkspace context:\n- Files: ${context.workspaceFiles.length}\n- Active: ${context.activeFile ?? "none"}` : ""}

Respond with a plan that includes: steps, affected files, risks, and estimated tool calls.`;

    const messages = [
      ...this.session.toApiMessages(),
      { role: "user", content: planPrompt },
    ];

    const response = await this.llmCompleter(messages);
    this.session.addAssistantMessage(response.content, response.toolCalls);
    this.session.setState("idle");
  }

  private async processAct(
    task: string,
    context?: AgentContext,
  ): Promise<void> {
    this.session.setState("executing");

    if (!this.llmCompleter) {
      this.session.addAssistantMessage(
        "Act mode requires an LLM provider to execute tasks. Please configure an AI provider.",
      );
      this.session.setState("idle");
      return;
    }

    const actPrompt = `You are in Act Mode. Execute the following task:
${task}
${context ? `\nActive file: ${context.activeFile ?? "none"}\nWorkspace files: ${context.workspaceFiles.length}` : ""}

Use available tools to complete the task. Request approval for medium/high-risk operations.`;

    let retries = 0;

    while (retries < this.maxRetries && !this.aborted) {
      const messages = [
        ...this.session.toApiMessages(),
        { role: "user", content: actPrompt },
      ];

      const response = await this.llmCompleter(messages);

      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          if (this.aborted) break;

          const approval = this.approvalGuard.requestApproval(
            toolCall,
            this.session.getPermissionLevel(),
            `Execute ${toolCall.toolName}`,
          );

          if (approval) {
            this.session.setState("awaiting_approval");
            // Wait for approval (in real app, this would be event-driven)
            this.session.addAssistantMessage(
              `⏳ Waiting for approval: ${toolCall.toolName} (${approval.riskLevel} risk)`,
            );
            return;
          }

          await this.executeToolCall(toolCall);
        }
      }

      this.session.addAssistantMessage(response.content, response.toolCalls);

      if (!response.toolCalls || response.toolCalls.length === 0) {
        break; // No more tool calls, task complete
      }

      retries++;
    }

    this.session.setState("completed");
  }

  private async processReview(
    content: string,
    context?: AgentContext,
  ): Promise<void> {
    if (!this.llmCompleter) {
      this.session.addAssistantMessage("Review mode requires an LLM provider.");
      this.session.setState("idle");
      return;
    }

    const reviewPrompt = `You are in Review Mode. Analyze the following for:
- Security risks
- Architecture violations
- Missing tests
- Code quality issues

Context: ${content}
${context?.gitDiff ? `\nGit diff:\n${context.gitDiff}` : ""}`;

    const messages = [
      ...this.session.toApiMessages(),
      { role: "user", content: reviewPrompt },
    ];

    const response = await this.llmCompleter(messages);
    this.session.addAssistantMessage(response.content);
    this.session.setState("idle");
  }

  // ── Tool execution ──

  private async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    this.emit({
      type: "agent.tool.call_started",
      sessionId: this.session.id,
      timestamp: Date.now(),
      payload: toolCall,
    });

    try {
      const result = await this.toolExecutor(
        toolCall.toolName,
        toolCall.arguments,
      );

      this.session.addToolResultMessage(toolCall, result);

      this.auditLog.log({
        sessionId: this.session.id,
        agentMode: this.session.getMode(),
        toolName: toolCall.toolName,
        permissionLevel: this.session.getPermissionLevel(),
        riskLevel: toolCall.riskLevel,
        inputSummary: JSON.stringify(toolCall.arguments).slice(0, 500),
        outputSummary: result.output.slice(0, 500),
        filesChanged: result.filesChanged,
        userApprovalState: "auto",
        error: result.error,
      });

      this.emit({
        type: "agent.tool.call_completed",
        sessionId: this.session.id,
        timestamp: Date.now(),
        payload: { toolCall, result },
      });

      return result;
    } catch (error) {
      const errorResult: ToolResult = {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      };

      this.auditLog.log({
        sessionId: this.session.id,
        agentMode: this.session.getMode(),
        toolName: toolCall.toolName,
        permissionLevel: this.session.getPermissionLevel(),
        riskLevel: toolCall.riskLevel,
        inputSummary: JSON.stringify(toolCall.arguments).slice(0, 500),
        outputSummary: "",
        error: errorResult.error,
        userApprovalState: "auto",
      });

      this.emit({
        type: "agent.tool.call_failed",
        sessionId: this.session.id,
        timestamp: Date.now(),
        payload: { toolCall, error: errorResult.error },
      });

      return errorResult;
    }
  }

  // ── Events ──

  onEvent(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private emit(event: AgentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Swallow listener errors
      }
    }
  }

  // ── Accessors ──

  getSession(): AgentSession {
    return this.session;
  }

  getAuditLog(): AuditLog {
    return this.auditLog;
  }

  getApprovalGuard(): ApprovalGuard {
    return this.approvalGuard;
  }
}

// ── Helpers ──

function formatPlan(plan: Plan): string {
  const lines: string[] = [`## Plan: ${plan.goal}`, "", "### Steps:"];

  for (const step of plan.steps) {
    const icon =
      step.status === "completed"
        ? "✅"
        : step.status === "failed"
          ? "❌"
          : step.status === "executing"
            ? "⏳"
            : "⬜";
    lines.push(
      `${icon} **${step.order}.** ${step.description} [${step.riskLevel}]`,
    );
    if (step.affectedFiles.length > 0) {
      lines.push(`   Files: ${step.affectedFiles.join(", ")}`);
    }
  }

  if (plan.risks.length > 0) {
    lines.push("", "### Risks:");
    for (const risk of plan.risks) {
      lines.push(`- ⚠️ ${risk}`);
    }
  }

  lines.push(
    "",
    `Estimated tool calls: ${plan.estimatedToolCalls}`,
    "",
    "Use `executePlan` to proceed or modify the plan first.",
  );

  return lines.join("\n");
}
