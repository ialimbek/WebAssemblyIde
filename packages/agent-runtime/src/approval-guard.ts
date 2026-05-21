/**
 * ApprovalGuard — enforces approval workflow for agent tool calls.
 * Based on ARCHITECTURE.md §10 permission levels and risk classification.
 */

import type {
  ToolCall,
  ApprovalRequest,
  RiskLevel,
  PermissionLevel,
  AgentEvent,
} from "./types";

type EventListener = (event: AgentEvent) => void;

/** Risk classification per tool category */
const TOOL_RISK_MAP: Record<string, RiskLevel> = {
  read_file: "low",
  search_files: "low",
  list_files: "low",
  git_diff: "low",
  lsp_diagnostics: "low",
  write_file: "medium",
  apply_patch: "medium",
  run_tests: "medium",
  run_command: "medium",
  package_manager: "medium",
  scratchpad_execute: "medium",
  open_preview: "low",
  reload_preview: "low",
  collect_console_logs: "low",
  collect_network_errors: "low",
  capture_screenshot: "low",
  git_push: "high",
  secret_access: "high",
  network_upload: "high",
};

/** Permission required per risk level */
const RISK_PERMISSION_MAP: Record<RiskLevel, PermissionLevel> = {
  low: "observe",
  medium: "edit",
  high: "execute",
};

/** Minimum permission level hierarchy */
const PERMISSION_HIERARCHY: PermissionLevel[] = [
  "observe",
  "suggest",
  "edit",
  "execute",
  "autonomous",
];

function permissionAtLeast(
  actual: PermissionLevel,
  required: PermissionLevel,
): boolean {
  return (
    PERMISSION_HIERARCHY.indexOf(actual) >=
    PERMISSION_HIERARCHY.indexOf(required)
  );
}

export class ApprovalGuard {
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvedAllTools: Set<string> = new Set();
  private listeners: EventListener[] = [];
  private approvalTimeoutMs: number = 120_000; // 2 minutes

  constructor(options?: { approvalTimeoutMs?: number }) {
    if (options?.approvalTimeoutMs) {
      this.approvalTimeoutMs = options.approvalTimeoutMs;
    }
  }

  /** Classify risk level of a tool call. */
  classifyRisk(toolCall: ToolCall): RiskLevel {
    return TOOL_RISK_MAP[toolCall.toolName] ?? "medium";
  }

  /** Determine required permission for a tool call. */
  getRequiredPermission(toolCall: ToolCall): PermissionLevel {
    const risk = this.classifyRisk(toolCall);
    return RISK_PERMISSION_MAP[risk];
  }

  /** Check if a tool call can proceed without approval. */
  canAutoApprove(
    toolCall: ToolCall,
    sessionPermission: PermissionLevel,
  ): boolean {
    const risk = this.classifyRisk(toolCall);
    const required = RISK_PERMISSION_MAP[risk];

    // Autonomous mode approves everything
    if (sessionPermission === "autonomous") return true;

    // If session permission is high enough and risk is low, auto-approve
    if (risk === "low" && permissionAtLeast(sessionPermission, "observe"))
      return true;

    // If user already approved all calls for this tool in this session
    if (this.approvedAllTools.has(toolCall.toolName)) return true;

    // Medium/high risk needs explicit approval unless permission is high enough
    return permissionAtLeast(sessionPermission, required);
  }

  /** Request approval for a tool call. Returns approval request or null if auto-approved. */
  requestApproval(
    toolCall: ToolCall,
    sessionPermission: PermissionLevel,
    description: string,
    diff?: string,
  ): ApprovalRequest | null {
    if (this.canAutoApprove(toolCall, sessionPermission)) {
      return null; // Auto-approved
    }

    const request: ApprovalRequest = {
      id: `approval-${toolCall.id}`,
      toolCall,
      description,
      riskLevel: this.classifyRisk(toolCall),
      diff,
      status: "pending",
      requestedAt: Date.now(),
    };

    this.pendingApprovals.set(request.id, request);

    this.emit({
      type: "agent.approval.requested",
      sessionId: "",
      timestamp: Date.now(),
      payload: request,
    });

    // Auto-reject after timeout
    setTimeout(() => {
      const pending = this.pendingApprovals.get(request.id);
      if (pending && pending.status === "pending") {
        pending.status = "timeout";
        pending.respondedAt = Date.now();
        this.pendingApprovals.delete(request.id);
      }
    }, this.approvalTimeoutMs);

    return request;
  }

  /** Respond to an approval request. */
  respond(
    requestId: string,
    response: "approve" | "reject" | "approve_all",
  ): ApprovalRequest | null {
    const request = this.pendingApprovals.get(requestId);
    if (!request) return null;

    request.respondedAt = Date.now();
    request.response = response;

    if (response === "approve" || response === "approve_all") {
      request.status = "approved";
      if (response === "approve_all") {
        this.approvedAllTools.add(request.toolCall.toolName);
      }
    } else {
      request.status = "rejected";
    }

    this.pendingApprovals.delete(requestId);

    this.emit({
      type: "agent.approval.responded",
      sessionId: "",
      timestamp: Date.now(),
      payload: request,
    });

    return request;
  }

  /** Get all pending approval requests. */
  getPending(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values());
  }

  /** Check if there are pending approvals. */
  hasPending(): boolean {
    return this.pendingApprovals.size > 0;
  }

  /** Clear approved-all state for a new session. */
  reset(): void {
    this.pendingApprovals.clear();
    this.approvedAllTools.clear();
  }

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
}
