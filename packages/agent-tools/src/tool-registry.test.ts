/**
 * Tool Registry tests — registration, execution, logging, schema generation.
 */

import { describe, it, expect } from "vitest";
import { ToolRegistry } from "./tool-registry";
import type { ToolManifest, ToolHandler } from "./tool-registry";

const TEST_MANIFEST: ToolManifest = {
  name: "test_tool",
  description: "A test tool",
  category: "test",
  riskLevel: "low",
  permissionRequired: "observe",
  inputSchema: {
    type: "object",
    properties: { input: { type: "string" } },
    required: ["input"],
  },
  requiresApproval: false,
};

const SUCCESS_HANDLER: ToolHandler = async (args) => ({
  success: true,
  output: `Got: ${args.input}`,
});

const FAIL_HANDLER: ToolHandler = async () => {
  throw new Error("Tool failed");
};

describe("ToolRegistry", () => {
  it("should register and list tools", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    expect(registry.count()).toBe(1);
    expect(registry.has("test_tool")).toBe(true);
    expect(registry.listTools()).toHaveLength(1);
  });

  it("should prevent duplicate registration", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    expect(() => registry.register(TEST_MANIFEST, SUCCESS_HANDLER)).toThrow(
      "already registered",
    );
  });

  it("should unregister tools", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    registry.unregister("test_tool");
    expect(registry.count()).toBe(0);
    expect(registry.has("test_tool")).toBe(false);
  });

  it("should execute a registered tool", async () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    const result = await registry.execute("test_tool", { input: "hello" });
    expect(result.success).toBe(true);
    expect(result.output).toBe("Got: hello");
  });

  it("should return error for unknown tool", async () => {
    const registry = new ToolRegistry();
    const result = await registry.execute("unknown_tool", {});
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("should handle tool execution errors", async () => {
    const registry = new ToolRegistry();
    registry.register({ ...TEST_MANIFEST, name: "fail_tool" }, FAIL_HANDLER);
    const result = await registry.execute("fail_tool", {});
    expect(result.success).toBe(false);
    expect(result.error).toBe("Tool failed");
  });

  it("should log executions", async () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    await registry.execute("test_tool", { input: "test" });
    const log = registry.getExecutionLog();
    expect(log).toHaveLength(1);
    expect(log[0].toolName).toBe("test_tool");
    expect(log[0].result.success).toBe(true);
    expect(log[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should clear execution log", async () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    await registry.execute("test_tool", { input: "test" });
    expect(registry.getExecutionLog()).toHaveLength(1);
    registry.clearLog();
    expect(registry.getExecutionLog()).toHaveLength(0);
  });

  it("should generate function call schema", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    const schema = registry.toFunctionCallSchema();
    expect(schema).toHaveLength(1);
    expect(schema[0].type).toBe("function");
    expect(schema[0].function.name).toBe("test_tool");
  });

  it("should filter by category", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    registry.register(
      { ...TEST_MANIFEST, name: "other_tool", category: "other" },
      SUCCESS_HANDLER,
    );
    expect(registry.listByCategory("test")).toHaveLength(1);
    expect(registry.listByCategory("other")).toHaveLength(1);
  });

  it("should filter by risk level", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    registry.register(
      { ...TEST_MANIFEST, name: "medium_tool", riskLevel: "medium" },
      SUCCESS_HANDLER,
    );
    expect(registry.listByRiskLevel("low")).toHaveLength(1);
    expect(registry.listByRiskLevel("medium")).toHaveLength(1);
    expect(registry.listByRiskLevel("high")).toHaveLength(0);
  });

  it("should get manifest by name", () => {
    const registry = new ToolRegistry();
    registry.register(TEST_MANIFEST, SUCCESS_HANDLER);
    const manifest = registry.getManifest("test_tool");
    expect(manifest).toBeDefined();
    expect(manifest!.name).toBe("test_tool");
    expect(manifest!.riskLevel).toBe("low");
  });
});
