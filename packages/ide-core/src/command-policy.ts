/**
 * Command Policy Guard — evaluates terminal commands for safety.
 *
 * Classifies commands by risk level and determines whether
 * they require user approval before execution.
 *
 * Integrates with:
 * - Terminal Session Manager (pre-execution check)
 * - Agent Runtime (agent tool command validation)
 * - Audit Log (policy decisions)
 */

/** Risk level for a terminal command */
export type CommandRiskLevel = "safe" | "caution" | "dangerous" | "blocked";

/** Policy decision */
export interface CommandPolicy {
  /** Risk level of the command */
  riskLevel: CommandRiskLevel;
  /** Whether the command is allowed to execute */
  allowed: boolean;
  /** Whether user approval is required */
  requiresApproval: boolean;
  /** Reason for the policy decision */
  reason?: string;
  /** Matched pattern (for debugging) */
  matchedPattern?: string;
}

/** Command policy configuration */
export interface CommandPolicyConfig {
  /** Commands that are always blocked */
  blockedPatterns: string[];
  /** Commands that require approval */
  dangerousPatterns: string[];
  /** Commands that are cautious (warn but allow) */
  cautionPatterns: string[];
  /** Whether network commands require approval */
  networkRequiresApproval: boolean;
  /** Whether package install requires approval */
  packageInstallRequiresApproval: boolean;
  /** Custom safe patterns (override caution/dangerous) */
  safeOverrides: string[];
}

/** Default command policy configuration */
const DEFAULT_POLICY_CONFIG: CommandPolicyConfig = {
  blockedPatterns: [
    "rm -rf /",
    "rm -rf /*",
    "mkfs",
    "dd if=",
    ":(){ :|:& };:", // fork bomb
    "chmod -R 777 /",
    "format ",
    "> /dev/sd",
  ],
  dangerousPatterns: [
    "rm -rf",
    "rm -r",
    "rmdir /s",
    "del /s",
    "del /f",
    "drop table",
    "drop database",
    "git push --force",
    "git reset --hard",
    "npm publish",
    "cargo publish",
    "pip install",
    "sudo ",
    "su ",
    "curl.*\\|.*sh",
    "wget.*\\|.*sh",
    "chmod 777",
    "chown -R",
    "kill -9",
    "taskkill /f",
    "shutdown",
    "reboot",
  ],
  cautionPatterns: [
    "git push",
    "git reset",
    "git checkout",
    "git merge",
    "git rebase",
    "npm install",
    "npm uninstall",
    "yarn add",
    "yarn remove",
    "pnpm install",
    "pnpm remove",
    "cargo install",
    "pip uninstall",
    "docker ",
    "kubectl ",
    "mv ",
    "cp -r",
    "ln -s",
  ],
  networkRequiresApproval: true,
  packageInstallRequiresApproval: true,
  safeOverrides: [
    "npm test",
    "npm run",
    "yarn test",
    "yarn run",
    "pnpm test",
    "pnpm run",
    "cargo test",
    "cargo build",
    "cargo check",
    "cargo clippy",
    "cargo fmt",
    "git status",
    "git log",
    "git diff",
    "git branch",
    "git show",
    "git stash list",
    "node ",
    "npx ",
    "python ",
    "pip list",
    "pip show",
    "ls",
    "dir",
    "cat",
    "type ",
    "echo",
    "pwd",
    "whoami",
    "which",
    "where",
    "find",
    "grep",
    "rg",
  ],
};

/**
 * Command Policy Guard — evaluates terminal commands for safety.
 */
export class CommandPolicyGuard {
  private config: CommandPolicyConfig;

  constructor(config?: Partial<CommandPolicyConfig>) {
    this.config = { ...DEFAULT_POLICY_CONFIG, ...config };
  }

  /**
   * Evaluate a command against the policy.
   */
  evaluate(command: string): CommandPolicy {
    const trimmed = command.trim();
    if (!trimmed) {
      return {
        riskLevel: "safe",
        allowed: true,
        requiresApproval: false,
        reason: "Empty command",
      };
    }

    // Check safe overrides first
    for (const pattern of this.config.safeOverrides) {
      if (matchesPattern(trimmed, pattern)) {
        return {
          riskLevel: "safe",
          allowed: true,
          requiresApproval: false,
          reason: "Matches safe pattern",
          matchedPattern: pattern,
        };
      }
    }

    // Check blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (matchesPattern(trimmed, pattern)) {
        return {
          riskLevel: "blocked",
          allowed: false,
          requiresApproval: false,
          reason: `Blocked: matches dangerous system pattern`,
          matchedPattern: pattern,
        };
      }
    }

    // Check dangerous patterns
    for (const pattern of this.config.dangerousPatterns) {
      if (matchesPattern(trimmed, pattern)) {
        return {
          riskLevel: "dangerous",
          allowed: true,
          requiresApproval: true,
          reason: "High-risk command requires approval",
          matchedPattern: pattern,
        };
      }
    }

    // Check caution patterns
    for (const pattern of this.config.cautionPatterns) {
      if (matchesPattern(trimmed, pattern)) {
        return {
          riskLevel: "caution",
          allowed: true,
          requiresApproval: true,
          reason: "Medium-risk command requires approval",
          matchedPattern: pattern,
        };
      }
    }

    // Check network commands
    if (this.config.networkRequiresApproval && isNetworkCommand(trimmed)) {
      return {
        riskLevel: "caution",
        allowed: true,
        requiresApproval: true,
        reason: "Network command requires approval",
      };
    }

    // Default: allow without approval
    return {
      riskLevel: "safe",
      allowed: true,
      requiresApproval: false,
    };
  }

  /**
   * Get the current policy configuration.
   */
  getConfig(): CommandPolicyConfig {
    return this.config;
  }

  /**
   * Update the policy configuration.
   */
  updateConfig(patch: Partial<CommandPolicyConfig>): void {
    Object.assign(this.config, patch);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Check if a command matches a pattern.
 * Supports simple substring matching and basic regex-like patterns.
 */
function matchesPattern(command: string, pattern: string): boolean {
  // Exact match
  if (command === pattern) return true;

  // Starts with
  if (command.startsWith(pattern)) return true;

  // Contains
  if (command.includes(pattern)) return true;

  // Simple pipe check for "curl|sh" style patterns
  if (pattern.includes(".*")) {
    try {
      const regex = new RegExp(pattern, "i");
      return regex.test(command);
    } catch {
      // Invalid regex, fall through to substring
    }
  }

  return false;
}

/**
 * Check if a command makes network requests.
 */
function isNetworkCommand(command: string): boolean {
  const networkCommands = [
    "curl",
    "wget",
    "http",
    "https",
    "ssh",
    "scp",
    "rsync",
    "ftp",
    "sftp",
    "nc ",
    "netcat",
    "nmap",
  ];

  const firstWord = command.split(/\s+/)[0]?.toLowerCase() ?? "";
  return networkCommands.some(
    (nc) => firstWord === nc || firstWord.endsWith(`/${nc}`),
  );
}
