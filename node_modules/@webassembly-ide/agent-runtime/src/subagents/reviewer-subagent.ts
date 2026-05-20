/**
 * Reviewer SubAgent
 *
 * Specialized SubAgent for reviewing diffs, checking architecture compliance,
 * identifying security risks, and finding test gaps.
 *
 * Permission Level: observe (read-only)
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
  Finding,
} from "./types.js";

// ─── Reviewer SubAgent Definition ───────────────────────────────────────────

export const REVIEWER_SUBAGENT_DEFINITION: SubAgentDefinition = {
  id: "reviewer",
  name: "Code Reviewer",
  role: "reviewer",
  allowedTools: [
    "read_file",
    "search_files",
    "list_files",
    "git_diff",
    "lsp_diagnostics",
  ],
  permissionLevel: "observe",
  maxContextTokens: 50_000,
  timeoutMs: 90_000, // 90 seconds
  supportsParallel: true,
  description:
    "Reviews diffs, checks architecture compliance, identifies security risks, and finds test gaps.",
};

// ─── Review Patterns ────────────────────────────────────────────────────────

/**
 * Patterns that indicate potential security risks in code.
 */
const SECURITY_PATTERNS = [
  {
    pattern: /eval\s*\(/,
    description: "Use of eval() — potential code injection risk",
  },
  {
    pattern: /innerHTML\s*=/,
    description: "Direct innerHTML assignment — potential XSS risk",
  },
  {
    pattern: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']+["']/i,
    description: "Hardcoded credential detected",
  },
  {
    pattern: /exec\s*\(/,
    description: "Shell exec() usage — potential command injection",
  },
  {
    pattern: /\.env\b/,
    description: "Environment file reference — check for credential exposure",
  },
];

/**
 * Patterns that indicate architecture violations.
 */
const ARCHITECTURE_PATTERNS = [
  {
    pattern: /import.*from\s+["']\.\.\/\.\.\//,
    description: "Deep relative import — consider using path aliases",
  },
  {
    pattern: /console\.log\s*\(/,
    description: "Console.log statement — should use proper logging",
  },
  {
    pattern: /any\b/,
    description: "TypeScript 'any' usage — prefer explicit types",
  },
];

// ─── Reviewer SubAgent Implementation ───────────────────────────────────────

export class ReviewerSubAgent extends BaseSubAgent {
  constructor(
    toolExecutor: ToolExecutor,
    eventEmitter?: SubAgentEventEmitter,
    approvalHandler?: ApprovalHandler,
  ) {
    super(
      REVIEWER_SUBAGENT_DEFINITION,
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

    const reviewType = task.context.metadata?.reviewType as string;

    switch (reviewType) {
      case "security":
        return this.handleSecurityReview(task, tools, startTime);
      case "architecture":
        return this.handleArchitectureReview(task, tools, startTime);
      case "diff":
        return this.handleDiffReview(task, tools, startTime);
      case "full":
        return this.handleFullReview(task, tools, startTime);
      default:
        return this.handleDiffReview(task, tools, startTime);
    }
  }

  // ─── Review Handlers ─────────────────────────────────────────────────

  /**
   * Perform a security-focused review on specified files.
   */
  private async handleSecurityReview(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
  ): Promise<SubAgentResult> {
    const findings: Finding[] = [];
    const filePaths = task.context.filePaths ?? [];

    for (const filePath of filePaths) {
      try {
        const result = await tools.call("read_file", { path: filePath });

        if (!result.success) continue;

        const content = result.output;
        const lines = content.split("\n");

        for (const { pattern, description } of SECURITY_PATTERNS) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              findings.push({
                category: "security",
                severity: "high",
                description,
                filePath,
                line: i + 1,
                suggestion: "Review this line for security implications.",
              });
            }
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return this.buildReviewResult(
      task.id,
      "security",
      findings,
      startTime,
      tools,
    );
  }

  /**
   * Perform an architecture compliance review.
   */
  private async handleArchitectureReview(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
  ): Promise<SubAgentResult> {
    const findings: Finding[] = [];
    const filePaths = task.context.filePaths ?? [];

    for (const filePath of filePaths) {
      try {
        const result = await tools.call("read_file", { path: filePath });

        if (!result.success) continue;

        const content = result.output;
        const lines = content.split("\n");

        for (const { pattern, description } of ARCHITECTURE_PATTERNS) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              findings.push({
                category: "architecture",
                severity: "medium",
                description,
                filePath,
                line: i + 1,
                suggestion:
                  "Consider refactoring this to follow project conventions.",
              });
            }
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return this.buildReviewResult(
      task.id,
      "architecture",
      findings,
      startTime,
      tools,
    );
  }

  /**
   * Review a git diff for issues.
   */
  private async handleDiffReview(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
  ): Promise<SubAgentResult> {
    try {
      const result = await tools.call("git_diff", {});

      if (!result.success) {
        return {
          taskId: task.id,
          subAgentId: this.definition.id,
          status: "failed",
          output: `Failed to get git diff: ${result.error ?? result.output}`,
          error: {
            code: "INTERNAL_ERROR",
            message: result.error ?? result.output,
            recoverable: true,
          },
          toolCalls: tools.getCallLog(),
          durationMs: Date.now() - startTime,
          completedAt: Date.now(),
        };
      }

      // Analyze the diff content for issues
      const findings = this.analyzeDiff(result.output);

      return this.buildReviewResult(
        task.id,
        "diff",
        findings,
        startTime,
        tools,
        result.output,
      );
    } catch (error) {
      return {
        taskId: task.id,
        subAgentId: this.definition.id,
        status: "failed",
        output: `Diff review failed: ${String(error)}`,
        error: {
          code: "INTERNAL_ERROR",
          message: String(error),
          recoverable: true,
        },
        toolCalls: tools.getCallLog(),
        durationMs: Date.now() - startTime,
        completedAt: Date.now(),
      };
    }
  }

  /**
   * Perform a full review combining security, architecture, and diff checks.
   */
  private async handleFullReview(
    task: SubAgentTask,
    tools: SubAgentToolProxy,
    startTime: number,
  ): Promise<SubAgentResult> {
    const findings: Finding[] = [];

    // Run security checks on files
    const filePaths = task.context.filePaths ?? [];
    for (const filePath of filePaths) {
      try {
        const result = await tools.call("read_file", { path: filePath });
        if (!result.success) continue;

        const lines = result.output.split("\n");

        // Security patterns
        for (const { pattern, description } of SECURITY_PATTERNS) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              findings.push({
                category: "security",
                severity: "high",
                description,
                filePath,
                line: i + 1,
              });
            }
          }
        }

        // Architecture patterns
        for (const { pattern, description } of ARCHITECTURE_PATTERNS) {
          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              findings.push({
                category: "architecture",
                severity: "medium",
                description,
                filePath,
                line: i + 1,
              });
            }
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Also check git diff
    try {
      const diffResult = await tools.call("git_diff", {});
      if (diffResult.success) {
        const diffFindings = this.analyzeDiff(diffResult.output);
        findings.push(...diffFindings);
      }
    } catch {
      // Diff check is optional
    }

    return this.buildReviewResult(task.id, "full", findings, startTime, tools);
  }

  // ─── Analysis Helpers ────────────────────────────────────────────────

  /**
   * Analyze a unified diff for potential issues.
   */
  private analyzeDiff(diffContent: string): Finding[] {
    const findings: Finding[] = [];
    const lines = diffContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Only check added lines
      if (!line.startsWith("+")) continue;
      const addedLine = line.substring(1);

      // Check security patterns in added lines
      for (const { pattern, description } of SECURITY_PATTERNS) {
        if (pattern.test(addedLine)) {
          findings.push({
            category: "security",
            severity: "high",
            description: `[New code] ${description}`,
            line: i + 1,
            suggestion: "This was added in the diff — review before merging.",
          });
        }
      }

      // Large file additions
      if (addedLine.length > 500) {
        findings.push({
          category: "quality",
          severity: "low",
          description:
            "Very long line added — consider breaking into multiple lines",
          line: i + 1,
        });
      }
    }

    return findings;
  }

  /**
   * Build a structured review result.
   */
  private buildReviewResult(
    taskId: string,
    reviewType: string,
    findings: Finding[],
    startTime: number,
    tools: SubAgentToolProxy,
    diffContent?: string,
  ): SubAgentResult {
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    const summary =
      findings.length === 0
        ? `No issues found in ${reviewType} review.`
        : `Found ${findings.length} issue(s): ${highCount} high, ${mediumCount} medium, ${lowCount} low severity.`;

    return {
      taskId,
      subAgentId: this.definition.id,
      status: "success",
      output: summary,
      data: {
        findings,
        custom: diffContent ? { diffContent } : undefined,
      },
      toolCalls: tools.getCallLog(),
      durationMs: Date.now() - startTime,
      completedAt: Date.now(),
    };
  }
}
