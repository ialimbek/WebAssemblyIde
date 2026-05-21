/**
 * Agent Runtime tests — session, approval guard, audit log, orchestrator, tool registry.
 */

import { describe, it, expect } from "vitest";
import { AgentSession } from "./agent-session";
import { ApprovalGuard } from "./approval-guard";
import { AuditLog } from "./audit-log";
import { AgentOrchestrator } from "./agent-orchestrator";
import type { ToolCall, ToolResult, AgentSessionConfig } from "./types";

// ── AgentSession Tests ──

describe("AgentSession", () => {
  const defaultConfig: AgentSessionConfig = {
    id: "test-session-1",
    mode: "chat",
    permissionLevel: "edit",
  };

  it("should create a session with correct defaults", () => {
    const session = new AgentSession(defaultConfig);
    expect(session.id).toBe("test-session-1");
    expect(session.getMode()).toBe("chat");
    expect(session.getState()).toBe("idle");
    expect(session.getPermissionLevel()).toBe("edit");
    expect(session.getMessages()).toHaveLength(0);
  });

  it("should add user messages", () => {
    const session = new AgentSession(defaultConfig);
    const msg = session.addUserMessage("Hello");
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Hello");
    expect(session.getMessages()).toHaveLength(1);
  });

  it("should add assistant messages with tool calls", () => {
    const session = new AgentSession(defaultConfig);
    session.addAssistantMessage("I'll help", []);
    expect(session.getMessages()).toHaveLength(1);
    expect(session.getLastAssistantMessage()?.content).toBe("I'll help");
  });

  it("should track tool result messages", () => {
    const session = new AgentSession(defaultConfig);
    const toolCall: ToolCall = {
      id: "tc-1",
      toolName: "read_file",
      arguments: { path: "/test.ts" },
      timestamp: Date.now(),
      riskLevel: "low",
      permissionRequired: "observe",
    };
    const result: ToolResult = {
      success: true,
      output: "file content",
    };
    session.addToolResultMessage(toolCall, result);
    expect(session.getMessages()).toHaveLength(1);
    expect(session.getMessages()[0].role).toBe("tool");
  });

  it("should change mode and emit event", () => {
    const session = new AgentSession(defaultConfig);
    const events: any[] = [];
    session.onEvent((e) => events.push(e));

    session.setMode("plan");
    expect(session.getMode()).toBe("plan");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("agent.mode.changed");
  });

  it("should change state and emit event", () => {
    const session = new AgentSession(defaultConfig);
    const events: any[] = [];
    session.onEvent((e) => events.push(e));

    session.setState("thinking");
    expect(session.getState()).toBe("thinking");
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("agent.session.state_changed");
  });

  it("should serialize to API messages", () => {
    const session = new AgentSession(defaultConfig);
    session.addUserMessage("Hello");
    session.addAssistantMessage("Hi!");
    const apiMessages = session.toApiMessages();
    expect(apiMessages).toHaveLength(2);
    expect(apiMessages[0].role).toBe("user");
    expect(apiMessages[1].role).toBe("assistant");
  });

  it("should include system prompt when configured", () => {
    const session = new AgentSession({
      ...defaultConfig,
      systemPrompt: "You are helpful.",
    });
    expect(session.getMessages()).toHaveLength(1);
    expect(session.getMessages()[0].role).toBe("system");
  });
});

// ── ApprovalGuard Tests ──

describe("ApprovalGuard", () => {
  const makeToolCall = (name: string): ToolCall => ({
    id: `tc-${name}`,
    toolName: name,
    arguments: {},
    timestamp: Date.now(),
    riskLevel: "low",
    permissionRequired: "observe",
  });

  it("should auto-approve low-risk tools with edit permission", () => {
    const guard = new ApprovalGuard();
    const tc = makeToolCall("read_file");
    expect(guard.canAutoApprove(tc, "edit")).toBe(true);
  });

  it("should auto-approve everything in autonomous mode", () => {
    const guard = new ApprovalGuard();
    const tc = makeToolCall("run_command");
    expect(guard.canAutoApprove(tc, "autonomous")).toBe(true);
  });

  it("should require approval for medium-risk tools with observe permission", () => {
    const guard = new ApprovalGuard();
    const tc = makeToolCall("write_file");
    expect(guard.canAutoApprove(tc, "observe")).toBe(false);
  });

  it("should request approval and return request", () => {
    const guard = new ApprovalGuard();
    const tc = makeToolCall("run_command");
    const request = guard.requestApproval(tc, "observe", "Run npm test");
    expect(request).not.toBeNull();
    expect(request!.status).toBe("pending");
    expect(guard.hasPending()).toBe(true);
  });

  it("should respond to approval request", () => {
    const guard = new ApprovalGuard();
    const tc = makeToolCall("run_command");
    const request = guard.requestApproval(tc, "observe", "Run build");
    expect(request).not.toBeNull();

    const response = guard.respond(request!.id, "approve");
    expect(response!.status).toBe("approved");
    expect(guard.hasPending()).toBe(false);
  });

  it("should support approve_all", () => {
    const guard = new ApprovalGuard();
    const tc1 = makeToolCall("run_command");
    const request1 = guard.requestApproval(tc1, "observe", "Run 1");
    guard.respond(request1!.id, "approve_all");

    // Second call to same tool should auto-approve
    const tc2 = makeToolCall("run_command");
    expect(guard.canAutoApprove(tc2, "observe")).toBe(true);
  });

  it("should classify risk levels correctly", () => {
    const guard = new ApprovalGuard();
    expect(guard.classifyRisk(makeToolCall("read_file"))).toBe("low");
    expect(guard.classifyRisk(makeToolCall("write_file"))).toBe("medium");
    expect(guard.classifyRisk(makeToolCall("run_command"))).toBe("medium");
    expect(guard.classifyRisk(makeToolCall("git_push"))).toBe("high");
  });

  it("should reset state", () => {
    const guard = new ApprovalGuard();
    const tc = makeToolCall("run_command");
    guard.requestApproval(tc, "observe", "test");
    expect(guard.hasPending()).toBe(true);

    guard.reset();
    expect(guard.hasPending()).toBe(false);
  });
});

// ── AuditLog Tests ──

describe("AuditLog", () => {
  it("should log entries", () => {
    const log = new AuditLog();
    const entry = log.log({
      sessionId: "s1",
      agentMode: "act",
      toolName: "read_file",
      permissionLevel: "edit",
      riskLevel: "low",
      inputSummary: 'path: "/test.ts"',
      outputSummary: "file content",
      userApprovalState: "auto",
    });
    expect(entry.id).toBeTruthy();
    expect(entry.toolName).toBe("read_file");
    expect(log.count()).toBe(1);
  });

  it("should filter by session", () => {
    const log = new AuditLog();
    log.log({
      sessionId: "s1",
      agentMode: "chat",
      toolName: "read_file",
      permissionLevel: "edit",
      riskLevel: "low",
      inputSummary: "",
      outputSummary: "",
      userApprovalState: "auto",
    });
    log.log({
      sessionId: "s2",
      agentMode: "act",
      toolName: "write_file",
      permissionLevel: "edit",
      riskLevel: "medium",
      inputSummary: "",
      outputSummary: "",
      userApprovalState: "approved",
    });

    expect(log.getSessionEntries("s1")).toHaveLength(1);
    expect(log.getSessionEntries("s2")).toHaveLength(1);
    expect(log.getSessionEntries("s3")).toHaveLength(0);
  });

  it("should track violations and errors", () => {
    const log = new AuditLog();
    log.log({
      sessionId: "s1",
      agentMode: "act",
      toolName: "run_command",
      permissionLevel: "edit",
      riskLevel: "high",
      inputSummary: "",
      outputSummary: "",
      userApprovalState: "auto",
      policyViolation: "attempted rm -rf",
    });
    log.log({
      sessionId: "s1",
      agentMode: "act",
      toolName: "run_command",
      permissionLevel: "edit",
      riskLevel: "medium",
      inputSummary: "",
      outputSummary: "",
      userApprovalState: "auto",
      error: "command not found",
    });

    expect(log.getViolations()).toHaveLength(1);
    expect(log.getErrors()).toHaveLength(1);
  });

  it("should produce summary statistics", () => {
    const log = new AuditLog();
    log.log({
      sessionId: "s1",
      agentMode: "chat",
      toolName: "read_file",
      permissionLevel: "edit",
      riskLevel: "low",
      inputSummary: "",
      outputSummary: "",
      userApprovalState: "auto",
    });
    log.log({
      sessionId: "s1",
      agentMode: "act",
      toolName: "write_file",
      permissionLevel: "edit",
      riskLevel: "medium",
      inputSummary: "",
      outputSummary: "",
      userApprovalState: "approved",
      filesChanged: ["/test.ts"],
    });

    const summary = log.getSummary();
    expect(summary.total).toBe(2);
    expect(summary.byRisk.low).toBe(1);
    expect(summary.byRisk.medium).toBe(1);
    expect(summary.filesChangedCount).toBe(1);
  });

  it("should export and import JSON", () => {
    const log = new AuditLog();
    log.log({
      sessionId: "s1",
      agentMode: "chat",
      toolName: "read_file",
      permissionLevel: "edit",
      riskLevel: "low",
      inputSummary: "test",
      outputSummary: "result",
      userApprovalState: "auto",
    });

    const json = log.exportJSON();
    const log2 = new AuditLog();
    log2.importJSON(json);
    expect(log2.count()).toBe(1);
    expect(log2.getEntries()[0].inputSummary).toBe("test");
  });

  it("should enforce max entries limit", () => {
    const log = new AuditLog({ maxEntries: 5 });
    for (let i = 0; i < 10; i++) {
      log.log({
        sessionId: "s1",
        agentMode: "chat",
        toolName: "read_file",
        permissionLevel: "edit",
        riskLevel: "low",
        inputSummary: `entry-${i}`,
        outputSummary: "",
        userApprovalState: "auto",
      });
    }
    expect(log.count()).toBe(5);
    // Latest entries should be kept
    expect(log.getEntries()[0].inputSummary).toBe("entry-5");
  });
});

// ── AgentOrchestrator Tests ──

describe("AgentOrchestrator", () => {
  const createMockToolExecutor = () => {
    return async (
      toolName: string,
      args: Record<string, unknown>,
    ): Promise<ToolResult> => ({
      success: true,
      output: `Mock result for ${toolName}`,
      metadata: { args },
    });
  };

  it("should process chat message without LLM (fallback)", async () => {
    const session = new AgentSession({
      id: "test",
      mode: "chat",
      permissionLevel: "edit",
    });
    const orchestrator = new AgentOrchestrator({
      session,
      toolExecutor: createMockToolExecutor(),
    });

    await orchestrator.processUserMessage("Hello");
    expect(session.getState()).toBe("completed");
    // user + assistant warning (no LLM configured)
    expect(session.getMessages().length).toBeGreaterThanOrEqual(2);
  });

  it("should create a plan in plan mode without LLM", async () => {
    const session = new AgentSession({
      id: "test",
      mode: "plan",
      permissionLevel: "edit",
    });
    const orchestrator = new AgentOrchestrator({
      session,
      toolExecutor: createMockToolExecutor(),
    });

    await orchestrator.processUserMessage("Fix the bug in auth.ts");
    expect(session.getState()).toBe("idle");
    const plan = orchestrator.getCurrentPlan();
    expect(plan).toBeDefined();
    expect(plan!.goal).toBe("Fix the bug in auth.ts");
    expect(plan!.steps.length).toBeGreaterThan(0);
  });

  it("should abort operations", async () => {
    const session = new AgentSession({
      id: "test",
      mode: "chat",
      permissionLevel: "edit",
    });
    const orchestrator = new AgentOrchestrator({
      session,
      toolExecutor: createMockToolExecutor(),
    });

    orchestrator.abort();
    expect(session.getState()).toBe("idle");
  });

  it("should emit events during tool execution", async () => {
    const session = new AgentSession({
      id: "test",
      mode: "act",
      permissionLevel: "autonomous",
    });

    // Listen on session events directly (orchestrator emits via session)
    const events: any[] = [];
    session.onEvent((e) => events.push(e));

    const orchestrator = new AgentOrchestrator({
      session,
      toolExecutor: createMockToolExecutor(),
      llmCompleter: async () => ({
        content: "Done!",
        toolCalls: [],
      }),
    });

    await orchestrator.processUserMessage("test");
    // Session emits message.added and state_changed events
    expect(events.length).toBeGreaterThan(0);
  });

  it("should access session, audit log, and approval guard", () => {
    const session = new AgentSession({
      id: "test",
      mode: "chat",
      permissionLevel: "edit",
    });
    const orchestrator = new AgentOrchestrator({
      session,
      toolExecutor: createMockToolExecutor(),
    });

    expect(orchestrator.getSession()).toBe(session);
    expect(orchestrator.getAuditLog()).toBeDefined();
    expect(orchestrator.getApprovalGuard()).toBeDefined();
  });
});
