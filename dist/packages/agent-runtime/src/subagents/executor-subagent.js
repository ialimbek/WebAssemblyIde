/**
 * Executor SubAgent
 *
 * Specialized SubAgent for running terminal commands, tests, builds, and lints.
 * All command executions require explicit user approval due to high risk level.
 *
 * Permission Level: execute (requires approval)
 * Risk Level: high
 */
import { BaseSubAgent, } from "./base-subagent.js";
// ─── Executor SubAgent Definition ───────────────────────────────────────────
export const EXECUTOR_SUBAGENT_DEFINITION = {
    id: "executor",
    name: "Command Executor",
    role: "executor",
    allowedTools: [
        "run_command",
        "run_tests",
        "package_manager",
        "lsp_diagnostics",
    ],
    permissionLevel: "execute",
    maxContextTokens: 40_000,
    timeoutMs: 120_000, // 2 minutes for long-running commands
    supportsParallel: false,
    description: "Runs terminal commands, tests, builds, and package manager operations. All executions require user approval.",
};
// ─── Risk Classification for Commands ───────────────────────────────────────
/**
 * Patterns that indicate destructive or high-risk commands.
 * These require explicit approval and are flagged in audit logs.
 */
const DESTRUCTIVE_PATTERNS = [
    /rm\s+-rf/i,
    /rmdir\s+\/s/i,
    /del\s+\/[sfq]/i,
    /git\s+push\s+/i,
    /git\s+reset\s+--hard/i,
    /npm\s+publish/i,
    /docker\s+rm/i,
];
/**
 * Safe commands that don't modify the system.
 */
const SAFE_COMMAND_PATTERNS = [
    /^ls\b/,
    /^dir\b/,
    /^cat\b/,
    /^echo\b/,
    /^pwd\b/,
    /^git\s+status\b/,
    /^git\s+log\b/,
    /^git\s+diff\b/,
    /^npm\s+ls\b/,
    /^node\s+--version\b/,
    /^npm\s+--version\b/,
];
// ─── Executor SubAgent Implementation ───────────────────────────────────────
export class ExecutorSubAgent extends BaseSubAgent {
    constructor(toolExecutor, eventEmitter, approvalHandler) {
        super(EXECUTOR_SUBAGENT_DEFINITION, toolExecutor, eventEmitter, approvalHandler);
    }
    async execute(task, tools) {
        const startTime = Date.now();
        const operation = task.context.metadata?.operation;
        switch (operation) {
            case "run_command":
                return this.handleRunCommand(task, tools, startTime);
            case "run_tests":
                return this.handleRunTests(task, tools, startTime);
            case "package_manager":
                return this.handlePackageManager(task, tools, startTime);
            default:
                return {
                    taskId: task.id,
                    subAgentId: this.definition.id,
                    status: "failed",
                    output: `Unknown executor operation: "${operation}". Supported: run_command, run_tests, package_manager`,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: `Unsupported operation: ${operation}`,
                        recoverable: false,
                    },
                    durationMs: Date.now() - startTime,
                    completedAt: Date.now(),
                };
        }
    }
    // ─── Operation Handlers ──────────────────────────────────────────────
    /**
     * Handle a general shell command execution.
     * Classifies risk level and requires approval for medium/high risk commands.
     */
    async handleRunCommand(task, tools, startTime) {
        const command = task.context.metadata?.command;
        const workingDir = task.context.metadata?.workingDir;
        if (!command) {
            return this.errorResult(task.id, "Missing required 'command' in task context metadata.", startTime, tools);
        }
        // Classify command risk
        const riskLevel = this.classifyCommandRisk(command);
        // Request approval for non-safe commands
        if (riskLevel !== "safe") {
            const approved = await tools.requestApproval(`Execute command (${riskLevel} risk): ${command}`, `Working directory: ${workingDir ?? "default"}`);
            if (!approved) {
                return {
                    taskId: task.id,
                    subAgentId: this.definition.id,
                    status: "cancelled",
                    output: `Command execution was denied by user: ${command}`,
                    durationMs: Date.now() - startTime,
                    completedAt: Date.now(),
                    toolCalls: tools.getCallLog(),
                };
            }
        }
        try {
            const result = await tools.call("run_command", {
                command,
                cwd: workingDir,
            });
            const durationMs = Date.now() - startTime;
            const commandResult = {
                command,
                exitCode: result.success ? 0 : 1,
                stdout: result.output,
                stderr: result.error ?? "",
                durationMs: result.durationMs,
            };
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.output,
                data: {
                    commandsExecuted: [commandResult],
                },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
        catch (error) {
            return this.errorResult(task.id, String(error), startTime, tools);
        }
    }
    /**
     * Handle test execution.
     * Always requires approval.
     */
    async handleRunTests(task, tools, startTime) {
        const testCommand = task.context.metadata?.testCommand;
        const workingDir = task.context.metadata?.workingDir;
        // Request approval
        const approved = await tools.requestApproval(`Run tests: ${testCommand ?? "default test runner"}`, `Working directory: ${workingDir ?? "default"}`);
        if (!approved) {
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: "cancelled",
                output: "Test execution was denied by user.",
                durationMs: Date.now() - startTime,
                completedAt: Date.now(),
                toolCalls: tools.getCallLog(),
            };
        }
        try {
            const result = await tools.call("run_tests", {
                command: testCommand,
                cwd: workingDir,
            });
            const durationMs = Date.now() - startTime;
            const commandResult = {
                command: testCommand ?? "test runner",
                exitCode: result.success ? 0 : 1,
                stdout: result.output,
                stderr: result.error ?? "",
                durationMs: result.durationMs,
            };
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.success
                    ? `Tests passed.\n${result.output}`
                    : `Tests failed.\n${result.output}`,
                data: {
                    commandsExecuted: [commandResult],
                },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
        catch (error) {
            return this.errorResult(task.id, String(error), startTime, tools);
        }
    }
    /**
     * Handle package manager operations (install, uninstall, update).
     * Always requires approval.
     */
    async handlePackageManager(task, tools, startTime) {
        const pmAction = task.context.metadata?.pmAction; // install, uninstall, update
        const packageName = task.context.metadata?.packageName;
        const workingDir = task.context.metadata?.workingDir;
        if (!pmAction) {
            return this.errorResult(task.id, "Missing required 'pmAction' in task context metadata (install, uninstall, update).", startTime, tools);
        }
        // Always require approval for package manager operations
        const approved = await tools.requestApproval(`Package manager: ${pmAction} ${packageName ?? ""}`, `This will modify package.json and node_modules.`);
        if (!approved) {
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: "cancelled",
                output: `Package manager operation was denied by user: ${pmAction}`,
                durationMs: Date.now() - startTime,
                completedAt: Date.now(),
                toolCalls: tools.getCallLog(),
            };
        }
        try {
            const result = await tools.call("package_manager", {
                action: pmAction,
                package: packageName,
                cwd: workingDir,
            });
            const durationMs = Date.now() - startTime;
            const commandResult = {
                command: `pm ${pmAction} ${packageName ?? ""}`,
                exitCode: result.success ? 0 : 1,
                stdout: result.output,
                stderr: result.error ?? "",
                durationMs: result.durationMs,
            };
            return {
                taskId: task.id,
                subAgentId: this.definition.id,
                status: result.success ? "success" : "failed",
                output: result.output,
                data: {
                    commandsExecuted: [commandResult],
                },
                toolCalls: tools.getCallLog(),
                durationMs,
                completedAt: Date.now(),
            };
        }
        catch (error) {
            return this.errorResult(task.id, String(error), startTime, tools);
        }
    }
    // ─── Risk Classification ─────────────────────────────────────────────
    /**
     * Classify a command's risk level based on pattern matching.
     * Returns 'safe', 'medium', or 'high'.
     */
    classifyCommandRisk(command) {
        // Check for destructive patterns
        for (const pattern of DESTRUCTIVE_PATTERNS) {
            if (pattern.test(command)) {
                return "high";
            }
        }
        // Check for safe patterns
        for (const pattern of SAFE_COMMAND_PATTERNS) {
            if (pattern.test(command)) {
                return "safe";
            }
        }
        // Default to medium risk for unknown commands
        return "medium";
    }
    // ─── Helpers ─────────────────────────────────────────────────────────
    errorResult(taskId, message, startTime, tools) {
        return {
            taskId,
            subAgentId: this.definition.id,
            status: "failed",
            output: message,
            error: {
                code: "INTERNAL_ERROR",
                message,
                recoverable: true,
            },
            toolCalls: tools.getCallLog(),
            durationMs: Date.now() - startTime,
            completedAt: Date.now(),
        };
    }
}
//# sourceMappingURL=executor-subagent.js.map