import { describe, expect, it } from "vitest";

import {
  assertCriticalStartupModule,
  CRITICAL_STARTUP_PATH,
  DEFERRED_STARTUP_MODULES,
  STARTUP_MEASUREMENT_POINTS,
} from "./startup-contracts.js";

describe("startup contracts", () => {
  it("defines the shell-first critical path", () => {
    expect(CRITICAL_STARTUP_PATH.map((module) => module.id)).toContain(
      "application-shell",
    );
    expect(CRITICAL_STARTUP_PATH.map((module) => module.id)).toContain(
      "agent-panel-placeholder",
    );
  });

  it("keeps heavy services deferred", () => {
    expect(DEFERRED_STARTUP_MODULES.map((module) => module.id)).toContain(
      "lsp-clients",
    );
    expect(DEFERRED_STARTUP_MODULES.map((module) => module.id)).toContain(
      "terminal-pty-session-manager",
    );
  });

  it("defines startup measurement points", () => {
    expect(STARTUP_MEASUREMENT_POINTS.map((point) => point.id)).toContain(
      "app-shell-first-paint",
    );
    expect(STARTUP_MEASUREMENT_POINTS.map((point) => point.id)).toContain(
      "interactive-startup",
    );
  });

  it("guards deferred modules from the critical path", () => {
    expect(() =>
      assertCriticalStartupModule("application-shell"),
    ).not.toThrow();
    expect(() => assertCriticalStartupModule("lsp-clients")).toThrow(
      /not allowed/,
    );
  });
});
