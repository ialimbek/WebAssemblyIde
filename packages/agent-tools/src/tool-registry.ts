/**
 * ToolRegistry — central registry for all agent tools.
 * Tools are registered with manifests and executed through this registry.
 * Based on ARCHITECTURE.md §6.2 Tool Registry design.
 */

import type { ToolResult } from "../../agent-runtime/src/types";

/** Risk level for tool policy */
export type ToolRiskLevel = "low" | "medium" | "high";

/** Permission required by tool */
export type ToolPermission =
  | "observe"
  | "suggest"
  | "edit"
  | "execute"
  | "autonomous";

/** Tool manifest — describes a tool's metadata and policy. */
export interface ToolManifest {
  name: string;
  description: string;
  category: string;
  riskLevel: ToolRiskLevel;
  permissionRequired: ToolPermission;
  inputSchema: Record<string, unknown>;
  /** Whether the tool requires explicit user approval */
  requiresApproval: boolean;
}

/** Tool implementation function. */
export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<ToolResult>;

/** Registered tool entry. */
interface RegisteredTool {
  manifest: ToolManifest;
  handler: ToolHandler;
}

/** Tool execution log entry. */
export interface ToolExecutionLog {
  toolName: string;
  args: Record<string, unknown>;
  result: ToolResult;
  timestamp: number;
  durationMs: number;
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();
  private executionLog: ToolExecutionLog[] = [];
  private maxLogSize: number = 5000;

  /** Register a tool with its manifest and handler. */
  register(manifest: ToolManifest, handler: ToolHandler): void {
    if (this.tools.has(manifest.name)) {
      throw new Error(`Tool '${manifest.name}' is already registered`);
    }
    this.tools.set(manifest.name, { manifest, handler });
  }

  /** Unregister a tool. */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /** Check if a tool is registered. */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Get tool manifest by name. */
  getManifest(name: string): ToolManifest | undefined {
    return this.tools.get(name)?.manifest;
  }

  /** List all registered tool manifests. */
  listTools(): ToolManifest[] {
    return Array.from(this.tools.values()).map((t) => t.manifest);
  }

  /** List tools filtered by category. */
  listByCategory(category: string): ToolManifest[] {
    return this.listTools().filter((t) => t.category === category);
  }

  /** List tools filtered by risk level. */
  listByRiskLevel(risk: ToolRiskLevel): ToolManifest[] {
    return this.listTools().filter((t) => t.riskLevel === risk);
  }

  /** Execute a tool by name with arguments. */
  async execute(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> {
    const registered = this.tools.get(name);
    if (!registered) {
      return {
        success: false,
        output: "",
        error: `Tool '${name}' not found in registry`,
      };
    }

    const startTime = Date.now();

    try {
      const result = await registered.handler(args);
      const durationMs = Date.now() - startTime;

      this.logExecution({
        toolName: name,
        args,
        result,
        timestamp: startTime,
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorResult: ToolResult = {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      };

      this.logExecution({
        toolName: name,
        args,
        result: errorResult,
        timestamp: startTime,
        durationMs,
      });

      return errorResult;
    }
  }

  /** Get execution log. */
  getExecutionLog(): readonly ToolExecutionLog[] {
    return this.executionLog;
  }

  /** Clear execution log. */
  clearLog(): void {
    this.executionLog = [];
  }

  /** Get count of registered tools. */
  count(): number {
    return this.tools.size;
  }

  /** Generate tool schema array for LLM function calling. */
  toFunctionCallSchema(): Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> {
    return this.listTools().map((manifest) => ({
      type: "function" as const,
      function: {
        name: manifest.name,
        description: manifest.description,
        parameters: manifest.inputSchema,
      },
    }));
  }

  private logExecution(log: ToolExecutionLog): void {
    this.executionLog.push(log);
    if (this.executionLog.length > this.maxLogSize) {
      this.executionLog = this.executionLog.slice(-this.maxLogSize);
    }
  }
}
