/**
 * File System Abstraction — platform-independent file system interface.
 *
 * Defines the contract for file operations that can be implemented by:
 * - Browser FS adapter (File System Access API / OPFS)
 * - Desktop FS adapter (Tauri native FS)
 * - In-memory adapter (for testing and virtual workspaces)
 * - Git-backed adapter (for web-based git workspaces)
 */

import type { Disposable } from "@webassembly-ide/shared";
import type {
  WorkspaceEntry,
  FileReadResult,
  FileWriteOptions,
  PatchEntry,
  ListDirectoryOptions,
  FileChangeEvent,
} from "./workspace-types.js";

/**
 * File System Adapter interface.
 *
 * All workspace file operations go through this abstraction.
 * Implementations must handle platform differences, permissions, and errors.
 */
export interface FileSystemAdapter {
  /** Adapter name for debugging */
  readonly name: string;

  /** Whether the adapter supports writing */
  readonly canWrite: boolean;

  /** Whether the adapter supports watching for file changes */
  readonly canWatch: boolean;

  /** Read a file's content */
  readFile(path: string): Promise<FileReadResult>;

  /** Write content to a file */
  writeFile(path: string, options: FileWriteOptions): Promise<void>;

  /** Delete a file */
  deleteFile(path: string): Promise<void>;

  /** Rename/move a file */
  renameFile(oldPath: string, newPath: string): Promise<void>;

  /** Check if a file/directory exists */
  exists(path: string): Promise<boolean>;

  /** Check if path is a directory */
  isDirectory(path: string): Promise<boolean>;

  /** List directory contents */
  listDirectory(
    path: string,
    options?: ListDirectoryOptions,
  ): Promise<WorkspaceEntry[]>;

  /** Get file/directory metadata */
  stat(path: string): Promise<WorkspaceEntry>;

  /** Create a directory (and parents if needed) */
  createDirectory(path: string): Promise<void>;

  /** Watch for file changes (returns disposable to stop watching) */
  watch(path: string, callback: (event: FileChangeEvent) => void): Disposable;
}

/**
 * In-memory File System Adapter — for testing and virtual workspaces.
 *
 * Stores files in memory. Useful for:
 * - Unit tests
 * - Scratchpad runtime
 * - Virtual workspaces (e.g., preview-only)
 */
export class InMemoryFsAdapter implements FileSystemAdapter {
  readonly name = "in-memory";
  readonly canWrite = true;
  readonly canWatch = false;

  private files = new Map<string, string>();
  private directories = new Set<string>();
  private watchCallbacks = new Set<(event: FileChangeEvent) => void>();

  constructor(initialFiles?: Record<string, string>) {
    if (initialFiles) {
      for (const [path, content] of Object.entries(initialFiles)) {
        this.files.set(path, content);
        // Auto-create parent directories
        const parts = path.replace(/\\/g, "/").split("/");
        for (let i = 1; i < parts.length; i++) {
          this.directories.add(parts.slice(0, i).join("/"));
        }
      }
      this.directories.add("/");
    }
  }

  async readFile(path: string): Promise<FileReadResult> {
    const content = this.files.get(normalizePath(path));
    if (content === undefined) {
      throw new FsError(`File not found: ${path}`, "ENOENT", path);
    }
    return {
      content,
      encoding: "utf-8",
      size: content.length,
      modifiedAt: Date.now(),
      fromCache: false,
    };
  }

  async writeFile(path: string, options: FileWriteOptions): Promise<void> {
    const normalized = normalizePath(path);
    this.files.set(normalized, options.content);
    this.emitChange({
      type: "modified",
      path: normalized,
      timestamp: Date.now(),
    });
  }

  async deleteFile(path: string): Promise<void> {
    const normalized = normalizePath(path);
    if (!this.files.has(normalized)) {
      throw new FsError(`File not found: ${path}`, "ENOENT", path);
    }
    this.files.delete(normalized);
    this.emitChange({
      type: "deleted",
      path: normalized,
      timestamp: Date.now(),
    });
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = normalizePath(oldPath);
    const normalizedNew = normalizePath(newPath);
    const content = this.files.get(normalizedOld);
    if (content === undefined) {
      throw new FsError(`File not found: ${oldPath}`, "ENOENT", oldPath);
    }
    this.files.delete(normalizedOld);
    this.files.set(normalizedNew, content);
    this.emitChange({
      type: "renamed",
      path: normalizedOld,
      newPath: normalizedNew,
      timestamp: Date.now(),
    });
  }

  async exists(path: string): Promise<boolean> {
    const normalized = normalizePath(path);
    return this.files.has(normalized) || this.directories.has(normalized);
  }

  async isDirectory(path: string): Promise<boolean> {
    return this.directories.has(normalizePath(path));
  }

  async listDirectory(
    path: string,
    options?: ListDirectoryOptions,
  ): Promise<WorkspaceEntry[]> {
    const normalized = normalizePath(path);
    const prefix = normalized === "/" ? "" : normalized;
    const entries: WorkspaceEntry[] = [];
    const seen = new Map<string, WorkspaceEntry>();
    const maxDepth = options?.maxDepth ?? 0;
    const includeHidden = options?.includeHidden ?? false;

    const addEntry = (name: string, entry: WorkspaceEntry) => {
      if (!includeHidden && name.startsWith(".")) return;
      if (!seen.has(name)) seen.set(name, entry);
    };

    for (const directory of this.directories) {
      if (directory === normalized) continue;
      if (!directory.startsWith(prefix + "/") && prefix !== "") continue;
      const relativePath = prefix === "" ? directory : directory.slice(prefix.length + 1);
      const segments = relativePath.split("/").filter(Boolean);
      if (segments.length !== 1) continue;
      const name = segments[0];
      addEntry(name, {
        path: prefix ? `${prefix}/${name}` : `/${name}`,
        name,
        isDirectory: true,
        size: 0,
        modifiedAt: Date.now(),
      });
    }

    // Find files in this directory
    for (const [filePath, content] of this.files) {
      if (!filePath.startsWith(prefix + "/") && prefix !== "") continue;

      const relativePath =
        prefix === "" ? filePath : filePath.slice(prefix.length + 1);
      const segments = relativePath.split("/");

      if (segments.length === 1) {
        // Direct child file
        const name = segments[0];
        addEntry(name, {
          path: filePath,
          name,
          isDirectory: false,
          size: content.length,
          modifiedAt: Date.now(),
          extension: name.includes(".") ? name.split(".").pop() : undefined,
        });
      } else {
        // Nested — show directory entry
        const dirName = segments[0];
        addEntry(dirName, {
          path: prefix ? `${prefix}/${dirName}` : dirName,
          name: dirName,
          isDirectory: true,
          size: 0,
          modifiedAt: Date.now(),
        });
      }
    }

    for (const entry of seen.values()) {
      if (entry.isDirectory && maxDepth > 0) {
        entries.push({
          ...entry,
          children: await this.listDirectory(entry.path, {
            ...options,
            maxDepth: maxDepth - 1,
          }),
        });
      } else {
        entries.push(entry);
      }
    }

    // Sort: directories first, then files alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    if (options?.limit) {
      return entries.slice(0, options.limit);
    }

    return entries;
  }

  async stat(path: string): Promise<WorkspaceEntry> {
    const normalized = normalizePath(path);
    const content = this.files.get(normalized);
    if (content !== undefined) {
      const name = normalized.split("/").pop() ?? normalized;
      return {
        path: normalized,
        name,
        isDirectory: false,
        size: content.length,
        modifiedAt: Date.now(),
        extension: name.includes(".") ? name.split(".").pop() : undefined,
      };
    }
    if (this.directories.has(normalized)) {
      const name = normalized.split("/").pop() ?? normalized;
      return {
        path: normalized,
        name,
        isDirectory: true,
        size: 0,
        modifiedAt: Date.now(),
      };
    }
    throw new FsError(`Path not found: ${path}`, "ENOENT", path);
  }

  async createDirectory(path: string): Promise<void> {
    this.directories.add(normalizePath(path));
  }

  watch(_path: string, callback: (event: FileChangeEvent) => void): Disposable {
    this.watchCallbacks.add(callback);
    return {
      dispose: () => {
        this.watchCallbacks.delete(callback);
      },
    };
  }

  /** Add a file to the in-memory FS (for setup/testing) */
  addFile(path: string, content: string): void {
    this.files.set(normalizePath(path), content);
  }

  /** Get all file paths (for testing) */
  getAllPaths(): string[] {
    return Array.from(this.files.keys());
  }

  private emitChange(event: FileChangeEvent): void {
    for (const cb of this.watchCallbacks) {
      try {
        cb(event);
      } catch (err) {
        console.error("[InMemoryFsAdapter] Watch callback error:", err);
      }
    }
  }
}

/**
 * File System Error with code and path context.
 */
export class FsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly path?: string,
  ) {
    super(message);
    this.name = "FsError";
  }
}

/**
 * Normalize a file path to use forward slashes.
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

/**
 * Apply a set of patches to file content.
 *
 * This is a pure function — it takes content and patches and returns new content.
 * It does not read from or write to the file system.
 */
export function applyPatchesToContent(
  content: string,
  patches: PatchEntry[],
): { result: string; errors: string[] } {
  const lines = content.split("\n");
  const errors: string[] = [];

  // Sort patches by line number (descending) to avoid offset issues
  const sorted = [...patches].sort((a, b) => b.lineStart - a.lineStart);

  for (const patch of sorted) {
    const startIdx = patch.lineStart - 1; // Convert to 0-based
    const endIdx = patch.lineEnd; // slice end is exclusive

    if (startIdx < 0 || startIdx > lines.length) {
      errors.push(
        `Invalid line range ${patch.lineStart}-${patch.lineEnd} (file has ${lines.length} lines)`,
      );
      continue;
    }

    switch (patch.op) {
      case "delete":
        lines.splice(startIdx, endIdx - startIdx);
        break;
      case "insert":
        if (patch.content) {
          lines.splice(startIdx, 0, ...patch.content.split("\n"));
        }
        break;
      case "replace":
        if (patch.content) {
          lines.splice(
            startIdx,
            endIdx - startIdx,
            ...patch.content.split("\n"),
          );
        }
        break;
    }
  }

  return { result: lines.join("\n"), errors };
}
