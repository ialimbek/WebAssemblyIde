import { describe, it, expect, beforeAll } from "vitest";
import {
  generateId,
  shortId,
  invariant,
  assertNever,
  detectLanguageForPath,
  findPlainTextMatches,
  joinPath,
  lastDelimitedLines,
  relativePath,
  scoreItemsByQuery,
  scoreMatch,
} from "./index.js";
import { resetCounter, getCounter } from "./internal.js";

describe("wasm-shared WebAssembly contract", () => {
  beforeAll(() => {
    resetCounter(0);
  });

  it("generateId returns a non-empty prefix_timestamp_random_counter string", () => {
    resetCounter(0);
    const id = generateId("test");
    expect(id.startsWith("test_")).toBe(true);
    const parts = id.split("_");
    expect(parts.length).toBe(4);
    expect(parts[0]).toBe("test");
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
    expect(parts[3]).toBe("1");
  });

  it("generateId default prefix is 'id'", () => {
    resetCounter(0);
    const id = generateId();
    expect(id.startsWith("id_")).toBe(true);
    const parts = id.split("_");
    expect(parts.length).toBe(4);
    expect(parts[0]).toBe("id");
  });

  it("generateId counter increments across calls", () => {
    resetCounter(0);
    generateId("x");
    generateId("x");
    const c = generateId("x");
    expect(c.split("_")[3]).toBe("3");
    expect(getCounter()).toBe(3);
  });

  it("shortId returns an 8-character base36 string", () => {
    for (let i = 0; i < 100; i++) {
      const id = shortId();
      expect(id.length).toBe(8);
      expect(id).toMatch(/^[0-9a-z]+$/);
    }
  });

  it("invariant throws when condition is false", () => {
    expect(() => invariant(false, "must hold")).toThrowError(
      /Invariant violation: must hold/,
    );
  });

  it("invariant passes when condition is true", () => {
    expect(() => invariant(true, "ok")).not.toThrow();
    expect(() => invariant(1, "ok")).not.toThrow();
  });

  it("assertNever always throws", () => {
    expect(() => assertNever("unexpected" as never)).toThrowError(
      /Unexpected value/,
    );
  });

  it("public index does NOT expose internal helpers", async () => {
    const mod = (await import("./index.js")) as Record<string, unknown>;
    expect(mod.__resetCounter).toBeUndefined();
    expect(mod.__getCounter).toBeUndefined();
    expect(mod.resetCounter).toBeUndefined();
    expect(mod.getCounter).toBeUndefined();
  });

  it("scores command and file candidates in wasm", () => {
    expect(scoreMatch("Open File", "open")).toBeGreaterThan(0);
    expect(scoreMatch("Open File", "zzzz")).toBe(0);

    const scored = scoreItemsByQuery(
      ["src/components/SearchPanel.tsx", "README.md", "package.json"],
      "search",
    );
    expect(scored[0]).toMatchObject({ index: 0 });
    expect(scored[0]?.score).toBeGreaterThan(0);
  });

  it("detects editor language ids from paths in wasm", () => {
    expect(detectLanguageForPath("src/App.tsx")).toBe("typescript");
    expect(detectLanguageForPath("Cargo.toml")).toBe("toml");
    expect(detectLanguageForPath("README.md")).toBe("markdown");
    expect(detectLanguageForPath("LICENSE")).toBe("plaintext");
  });

  it("normalizes common path operations in wasm", () => {
    expect(joinPath("/workspace/", "/src/main.ts")).toBe("/workspace/src/main.ts");
    expect(relativePath("/workspace/src/main.ts", "/workspace")).toBe("src/main.ts");
  });

  it("keeps terminal scrollback lines in wasm", () => {
    expect(lastDelimitedLines(["one", "two", "three"], 2)).toEqual(["two", "three"]);
  });

  it("finds plain text matches with context in wasm", () => {
    const matches = findPlainTextMatches("alpha\nbeta keyword\ngamma", "keyword");
    expect(matches).toEqual([
      {
        line: 2,
        column: 6,
        matchText: "keyword",
        contextBefore: "alpha",
        contextAfter: "gamma",
      },
    ]);
  });
});
