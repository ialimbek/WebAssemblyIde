/**
 * AuditLog — records all agent tool actions for transparency and compliance.
 * Based on ARCHITECTURE.md §10.3 Agent Action Log schema.
 */

import type {
  AuditLogEntry,
  AgentMode,
  PermissionLevel,
  RiskLevel,
} from "./types";

export class AuditLog {
  private entries: AuditLogEntry[] = [];
  private maxEntries: number;

  constructor(options?: { maxEntries?: number }) {
    this.maxEntries = options?.maxEntries ?? 10_000;
  }

  /** Record a completed tool call. */
  log(params: {
    sessionId: string;
    agentMode: AgentMode;
    toolName: string;
    permissionLevel: PermissionLevel;
    riskLevel: RiskLevel;
    inputSummary: string;
    outputSummary: string;
    filesChanged?: string[];
    userApprovalState: AuditLogEntry["userApprovalState"];
    resultingDiff?: string;
    error?: string;
    policyViolation?: string;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: params.sessionId,
      timestamp: Date.now(),
      agentMode: params.agentMode,
      toolName: params.toolName,
      permissionLevel: params.permissionLevel,
      riskLevel: params.riskLevel,
      inputSummary: params.inputSummary,
      outputSummary: params.outputSummary,
      filesChanged: params.filesChanged ?? [],
      userApprovalState: params.userApprovalState,
      resultingDiff: params.resultingDiff,
      error: params.error,
      policyViolation: params.policyViolation,
    };

    this.entries.push(entry);

    // Evict oldest if over limit
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    return entry;
  }

  /** Get all log entries. */
  getEntries(): readonly AuditLogEntry[] {
    return this.entries;
  }

  /** Get entries for a specific session. */
  getSessionEntries(sessionId: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.sessionId === sessionId);
  }

  /** Get entries filtered by risk level. */
  getEntriesByRisk(risk: RiskLevel): AuditLogEntry[] {
    return this.entries.filter((e) => e.riskLevel === risk);
  }

  /** Get entries that had policy violations. */
  getViolations(): AuditLogEntry[] {
    return this.entries.filter((e) => !!e.policyViolation);
  }

  /** Get entries that failed. */
  getErrors(): AuditLogEntry[] {
    return this.entries.filter((e) => !!e.error);
  }

  /** Get count of entries. */
  count(): number {
    return this.entries.length;
  }

  /** Clear all entries. */
  clear(): void {
    this.entries = [];
  }

  /** Export entries as JSON string for diagnostic bundle. */
  exportJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /** Import entries from JSON. */
  importJSON(json: string): void {
    const parsed = JSON.parse(json) as AuditLogEntry[];
    this.entries = parsed;
  }

  /** Summary statistics. */
  getSummary(): {
    total: number;
    byRisk: Record<RiskLevel, number>;
    byMode: Record<string, number>;
    violations: number;
    errors: number;
    filesChangedCount: number;
  } {
    const byRisk: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
    const byMode: Record<string, number> = {};
    let violations = 0;
    let errors = 0;
    const filesChangedSet = new Set<string>();

    for (const entry of this.entries) {
      byRisk[entry.riskLevel]++;
      byMode[entry.agentMode] = (byMode[entry.agentMode] ?? 0) + 1;
      if (entry.policyViolation) violations++;
      if (entry.error) errors++;
      for (const f of entry.filesChanged) filesChangedSet.add(f);
    }

    return {
      total: this.entries.length,
      byRisk,
      byMode,
      violations,
      errors,
      filesChangedCount: filesChangedSet.size,
    };
  }
}
