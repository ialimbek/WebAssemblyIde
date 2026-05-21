/**
 * Tests for EditorModelManager
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  EditorModelManager,
  resolveLanguageId,
  extractFileName,
} from "./editor-model.js";

describe("resolveLanguageId", () => {
  it("should resolve TypeScript files", () => {
    assert.strictEqual(resolveLanguageId("foo.ts"), "typescript");
    assert.strictEqual(resolveLanguageId("bar.tsx"), "typescript");
  });

  it("should resolve JavaScript files", () => {
    assert.strictEqual(resolveLanguageId("foo.js"), "javascript");
    assert.strictEqual(resolveLanguageId("bar.jsx"), "javascript");
  });

  it("should resolve Rust files", () => {
    assert.strictEqual(resolveLanguageId("lib.rs"), "rust");
  });

  it("should resolve JSON files", () => {
    assert.strictEqual(resolveLanguageId("config.json"), "json");
  });

  it("should resolve HTML/CSS files", () => {
    assert.strictEqual(resolveLanguageId("index.html"), "html");
    assert.strictEqual(resolveLanguageId("style.css"), "css");
  });

  it("should return plaintext for unknown extensions", () => {
    assert.strictEqual(resolveLanguageId("file.unknown"), "plaintext");
  });

  it("should return plaintext for no extension", () => {
    assert.strictEqual(resolveLanguageId("Makefile"), "plaintext");
  });
});

describe("extractFileName", () => {
  it("should extract file name from unix path", () => {
    assert.strictEqual(extractFileName("/home/user/foo.ts"), "foo.ts");
  });

  it("should extract file name from windows path", () => {
    assert.strictEqual(extractFileName("C:\\Users\\foo\\bar.ts"), "bar.ts");
  });

  it("should return the input for bare file names", () => {
    assert.strictEqual(extractFileName("foo.ts"), "foo.ts");
  });
});

describe("EditorModelManager", () => {
  let manager: EditorModelManager;

  beforeEach(() => {
    manager = new EditorModelManager();
  });

  it("should open a file and return model info", () => {
    const info = manager.openFile("file:///test.ts", "const x = 1;");
    assert.strictEqual(info.uri, "file:///test.ts");
    assert.strictEqual(info.fileName, "test.ts");
    assert.strictEqual(info.languageId, "typescript");
    assert.strictEqual(info.isDirty, false);
    assert.strictEqual(info.version, 1);
  });

  it("should return existing info when opening already-open file", () => {
    manager.openFile("file:///test.ts", "const x = 1;");
    const info2 = manager.openFile("file:///test.ts", "new content");
    assert.strictEqual(info2.version, 1); // should not create new version
  });

  it("should close a file", () => {
    manager.openFile("file:///test.ts", "const x = 1;");
    const closed = manager.closeFile("file:///test.ts");
    assert.strictEqual(closed, true);
    assert.strictEqual(manager.isOpen("file:///test.ts"), false);
  });

  it("should return false when closing non-existent file", () => {
    assert.strictEqual(manager.closeFile("file:///nonexistent.ts"), false);
  });

  it("should update content and mark dirty", () => {
    manager.openFile("file:///test.ts", "const x = 1;");
    const result = manager.updateContent("file:///test.ts", "const x = 2;");
    assert.strictEqual(result, true);
    const info = manager.getModelInfo("file:///test.ts");
    assert.strictEqual(info?.isDirty, true);
    assert.strictEqual(info?.version, 2);
  });

  it("should not update content of read-only models", () => {
    manager.openFile("file:///test.ts", "const x = 1;", { isReadOnly: true });
    const result = manager.updateContent("file:///test.ts", "const x = 2;");
    assert.strictEqual(result, false);
  });

  it("should mark file as saved", () => {
    manager.openFile("file:///test.ts", "const x = 1;");
    manager.updateContent("file:///test.ts", "const x = 2;");
    assert.strictEqual(manager.getModelInfo("file:///test.ts")?.isDirty, true);

    manager.markSaved("file:///test.ts");
    assert.strictEqual(manager.getModelInfo("file:///test.ts")?.isDirty, false);
  });

  it("should get content of a model", () => {
    manager.openFile("file:///test.ts", "hello world");
    assert.strictEqual(manager.getContent("file:///test.ts"), "hello world");
  });

  it("should track open URIs", () => {
    manager.openFile("file:///a.ts", "a");
    manager.openFile("file:///b.ts", "b");
    manager.openFile("file:///c.ts", "c");

    const uris = manager.getOpenUris();
    assert.strictEqual(uris.length, 3);
    assert.ok(uris.includes("file:///a.ts"));
    assert.ok(uris.includes("file:///b.ts"));
    assert.ok(uris.includes("file:///c.ts"));
  });

  it("should track dirty URIs", () => {
    manager.openFile("file:///a.ts", "a");
    manager.openFile("file:///b.ts", "b");
    manager.updateContent("file:///b.ts", "b2");

    const dirtyUris = manager.getDirtyUris();
    assert.strictEqual(dirtyUris.length, 1);
    assert.strictEqual(dirtyUris[0], "file:///b.ts");
  });

  it("should detect dirty models", () => {
    assert.strictEqual(manager.hasDirtyModels(), false);
    manager.openFile("file:///a.ts", "a");
    manager.updateContent("file:///a.ts", "a2");
    assert.strictEqual(manager.hasDirtyModels(), true);
  });

  it("should set and get markers", () => {
    manager.openFile("file:///test.ts", "const x = 1;");
    manager.setMarkers("file:///test.ts", [
      {
        range: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } },
        message: "test error",
        severity: "error",
      },
    ]);
    const markers = manager.getMarkers("file:///test.ts");
    assert.strictEqual(markers.length, 1);
    assert.strictEqual(markers[0].message, "test error");
  });

  it("should fire dirty state change listener", () => {
    manager.openFile("file:///test.ts", "const x = 1;");

    let calledUri: string | undefined;
    let calledDirty: boolean | undefined;

    manager.onDirtyStateChanged((uri, isDirty) => {
      calledUri = uri;
      calledDirty = isDirty;
    });

    manager.updateContent("file:///test.ts", "const x = 2;");
    assert.strictEqual(calledUri, "file:///test.ts");
    assert.strictEqual(calledDirty, true);
  });

  it("should fire model event listener", () => {
    const events: string[] = [];
    manager.onModelEvent((event) => {
      events.push(event);
    });

    manager.openFile("file:///test.ts", "const x = 1;");
    manager.updateContent("file:///test.ts", "const x = 2;");
    manager.markSaved("file:///test.ts");
    manager.closeFile("file:///test.ts");

    assert.deepStrictEqual(events, [
      "opened",
      "dirtyChanged",
      "dirtyChanged",
      "saved",
      "closed",
    ]);
  });

  it("should set read-only state", () => {
    manager.openFile("file:///test.ts", "const x = 1;");
    manager.setReadOnly("file:///test.ts", true);
    assert.strictEqual(
      manager.getModelInfo("file:///test.ts")?.isReadOnly,
      true,
    );

    // Should not be able to update content when read-only
    const result = manager.updateContent("file:///test.ts", "new");
    assert.strictEqual(result, false);
  });

  it("should dispose all models", () => {
    manager.openFile("file:///a.ts", "a");
    manager.openFile("file:///b.ts", "b");
    manager.dispose();

    assert.strictEqual(manager.getOpenCount(), 0);
    assert.strictEqual(manager.getOpenUris().length, 0);
  });
});
