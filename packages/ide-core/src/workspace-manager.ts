/**
 * Workspace Manager — manages workspace lifecycle and coordinates file operations.
 *
 * Responsibilities:
 * - Open/close workspaces
 * - Provide file read/write through the FS adapter
 * - Track workspace tree snapshot
 * - Emit workspace events via event bus integration
 * - Apply patches and coordinate with editor models
 */

import type { Disposable } from "@webassembly-ide/shared";
import { generateId } from "@webassembly-ide/shared";
import type {
  WorkspaceEntry,
  WorkspaceMetadata,
  WorkspaceOpenOptions,
  FileReadResult,
  FileWriteOptions,
  PatchEntry,
  ApplyPatchResult,
  ListDirectoryOptions,
  WorkspacePermission,
} from "./workspace-types.js";
import type { FileSystemAdapter } from "./file-system.js";
import { applyPatchesToContent, FsError } from "./file-system.js";

/**
 * Workspace Manager — high-level workspace operations.
 *
 * Usage:
 *   const manager = new WorkspaceManager(fsAdapter);
 *   await manager.openWorkspace({ root: "/home/user/project" });
 *   const file = await manager.readFile("/home/user/project/src/main.ts");
 */
export class WorkspaceManager {
  private adapter: FileSystemAdapter;
  private activeWorkspace: WorkspaceMetadata | null = null;
  private treeCache: WorkspaceEntry[] | null = null;
  private permission: WorkspacePermission | null = null;
  private recentWorkspaces: WorkspaceMetadata[] = [];
  private listeners = new Set<(event: string, data: unknown) => void>();

  constructor(adapter: FileSystemAdapter) {
    this.adapter = adapter;
  }

  // ─── Workspace Lifecycle ───────────────────────────────────────────────

  /**
   * Open a workspace.
   */
  async openWorkspace(
    options: WorkspaceOpenOptions,
  ): Promise<WorkspaceMetadata> {
    // Close existing workspace if any
    if (this.activeWorkspace) {
      await this.closeWorkspace();
    }

    const root = options.root;
    const name = options.name ?? extractWorkspaceName(root);

    // Verify root exists
    const exists = await this.adapter.exists(root);
    if (!exists) {
      throw new FsError(
        `Workspace root does not exist: ${root}`,
        "ENOENT",
        root,
      );
    }

    const isDir = await this.adapter.isDirectory(root);
    if (!isDir) {
      throw new FsError(
        `Workspace root is not a directory: ${root}`,
        "ENOTDIR",
        root,
      );
    }

    const metadata: WorkspaceMetadata = {
      id: generateId(),
      name,
      root,
      openedAt: Date.now(),
      lastActiveAt: Date.now(),
      isLoaded: true,
      type: options.type ?? "local",
    };

    this.activeWorkspace = metadata;
    this.treeCache = null;

    // Set default permission
    this.permission = {
      root,
      canWrite: this.adapter.canWrite,
      canExecute: false,
      deniedPaths: [],
      secretPatterns: [
        "**/.env",
        "**/.env.*",
        "**/secret*",
        "**/key*",
        "**/*.pem",
        "**/*.key",
        "**/credentials*",
      ],
    };

    // Scan workspace tree if requested
    if (options.scanOnOpen !== false) {
      await this.scanTree();
    }

    // Add to recent workspaces
    this.addToRecent(metadata);

    this.emit("workspace:opened", metadata);
    return metadata;
  }

  /**
   * Close the active workspace.
   */
  async closeWorkspace(): Promise<void> {
    if (!this.activeWorkspace) return;

    const id = this.activeWorkspace.id;
    this.activeWorkspace = null;
    this.treeCache = null;
    this.permission = null;

    this.emit("workspace:closed", { id });
  }

  /**
   * Get the active workspace metadata.
   */
  getActiveWorkspace(): WorkspaceMetadata | null {
    return this.activeWorkspace;
  }

  /**
   * Check if a workspace is open.
   */
  isOpen(): boolean {
    return this.activeWorkspace !== null;
  }

  // ─── File Operations ───────────────────────────────────────────────────

  /**
   * Read a file. Resolves relative paths against workspace root.
   */
  async readFile(path: string): Promise<FileReadResult> {
    const resolved = this.resolvePath(path);
    this.checkAccess(resolved, "read");

    const result = await this.adapter.readFile(resolved);
    this.touchWorkspace();
    return result;
  }

  /**
   * Write a file. Resolves relative paths against workspace root.
   */
  async writeFile(path: string, options: FileWriteOptions): Promise<void> {
    const resolved = this.resolvePath(path);
    this.checkAccess(resolved, "write");

    await this.adapter.writeFile(resolved, options);
    this.invalidateTreeCache();
    this.touchWorkspace();
    this.emit("workspace:fileWritten", { path: resolved });
  }

  /**
   * Delete a file.
   */
  async deleteFile(path: string): Promise<void> {
    const resolved = this.resolvePath(path);
    this.checkAccess(resolved, "write");

    await this.adapter.deleteFile(resolved);
    this.invalidateTreeCache();
    this.touchWorkspace();
    this.emit("workspace:fileDeleted", { path: resolved });
  }

  /**
   * Rename a file.
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const resolvedOld = this.resolvePath(oldPath);
    const resolvedNew = this.resolvePath(newPath);
    this.checkAccess(resolvedOld, "write");
    this.checkAccess(resolvedNew, "write");

    await this.adapter.renameFile(resolvedOld, resolvedNew);
    this.invalidateTreeCache();
    this.touchWorkspace();
    this.emit("workspace:fileRenamed", {
      oldPath: resolvedOld,
      newPath: resolvedNew,
    });
  }

  /**
   * Check if a path exists.
   */
  async exists(path: string): Promise<boolean> {
    const resolved = this.resolvePath(path);
    return this.adapter.exists(resolved);
  }

  /**
   * List directory contents.
   */
  async listDirectory(
    path: string,
    options?: ListDirectoryOptions,
  ): Promise<WorkspaceEntry[]> {
    const resolved = this.resolvePath(path);
    return this.adapter.listDirectory(resolved, options);
  }

  /**
   * Get file/directory metadata.
   */
  async stat(path: string): Promise<WorkspaceEntry> {
    const resolved = this.resolvePath(path);
    return this.adapter.stat(resolved);
  }

  /**
   * Create a directory.
   */
  async createDirectory(path: string): Promise<void> {
    const resolved = this.resolvePath(path);
    this.checkAccess(resolved, "write");

    await this.adapter.createDirectory(resolved);
    this.invalidateTreeCache();
    this.touchWorkspace();
    this.emit("workspace:directoryCreated", { path: resolved });
  }

  // ─── Patch Operations ──────────────────────────────────────────────────

  /**
   * Apply patches to a file. Returns the result with success/errors.
   */
  async applyPatch(
    path: string,
    patches: PatchEntry[],
  ): Promise<ApplyPatchResult> {
    const resolved = this.resolvePath(path);
    this.checkAccess(resolved, "write");

    try {
      const file = await this.adapter.readFile(resolved);
      const { result, errors } = applyPatchesToContent(file.content, patches);

      if (errors.length > 0) {
        return {
          success: false,
          modifiedFiles: [],
          errors: errors.map((msg) => ({ path: resolved, message: msg })),
        };
      }

      await this.adapter.writeFile(resolved, { content: result });
      this.invalidateTreeCache();
      this.touchWorkspace();
      this.emit("workspace:fileWritten", { path: resolved });

      return {
        success: true,
        modifiedFiles: [resolved],
        errors: [],
      };
    } catch (err) {
      return {
        success: false,
        modifiedFiles: [],
        errors: [
          {
            path: resolved,
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  }

  // ─── Workspace Tree ────────────────────────────────────────────────────

  /**
   * Get the workspace tree (cached or fresh scan).
   */
  async getTree(maxDepth = 3): Promise<WorkspaceEntry[]> {
    if (this.treeCache && maxDepth <= 3) {
      return this.treeCache;
    }

    return this.scanTree(maxDepth);
  }

  /**
   * Force a fresh tree scan.
   */
  async scanTree(maxDepth = 3): Promise<WorkspaceEntry[]> {
    if (!this.activeWorkspace) return [];

    const entries = await this.adapter.listDirectory(
      this.activeWorkspace.root,
      {
        maxDepth,
        includeHidden: false,
      },
    );

    if (maxDepth <= 3) {
      this.treeCache = entries;
    }

    this.emit("workspace:treeUpdated", { root: this.activeWorkspace.root });
    return entries;
  }

  // ─── Permissions ───────────────────────────────────────────────────────

  /**
   * Get current workspace permission.
   */
  getPermission(): WorkspacePermission | null {
    return this.permission;
  }

  /**
   * Update workspace permission.
   */
  setPermission(permission: WorkspacePermission): void {
    this.permission = permission;
  }

  // ─── Recent Workspaces ─────────────────────────────────────────────────

  /**
   * Get recent workspaces list.
   */
  getRecentWorkspaces(): WorkspaceMetadata[] {
    return this.recentWorkspaces;
  }

  // ─── Event Listener ────────────────────────────────────────────────────

  /**
   * Listen for workspace events.
   */
  onEvent(listener: (event: string, data: unknown) => void): Disposable {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  // ─── Dispose ───────────────────────────────────────────────────────────

  dispose(): void {
    this.activeWorkspace = null;
    this.treeCache = null;
    this.permission = null;
    this.listeners.clear();
  }

  // ─── Private Helpers ───────────────────────────────────────────────────

  /**
   * Resolve a path relative to workspace root if not absolute.
   */
  private resolvePath(path: string): string {
    // If path already starts with workspace root, return as-is
    if (this.activeWorkspace && path.startsWith(this.activeWorkspace.root)) {
      return path;
    }

    // If it looks like an absolute path, return as-is.
    // Match both Unix (/foo) and Windows (C:/foo or C:\foo) absolute paths.
    if (path.startsWith("/") || /^[A-Z]:[/\\]/i.test(path)) {
      return path;
    }

    // Resolve relative to workspace root
    if (!this.activeWorkspace) {
      throw new FsError("No workspace open", "ENOWORKSPACE");
    }

    const root = this.activeWorkspace.root.replace(/\\/g, "/");
    const cleanPath = path.replace(/^\.\//, "").replace(/^\//, "");
    return `${root}/${cleanPath}`;
  }

  /**
   * Check access permissions for a path.
   */
  private checkAccess(path: string, _operation: "read" | "write"): void {
    if (!this.permission) return;

    // Check denied paths
    for (const denied of this.permission.deniedPaths) {
      if (path.includes(denied)) {
        throw new FsError(`Access denied to path: ${path}`, "EACCES", path);
      }
    }

    // Check secret patterns (warn, don't block read)
    // Writing to secret files should be blocked
    if (_operation === "write") {
      for (const pattern of this.permission.secretPatterns) {
        const regex = globToRegex(pattern);
        if (regex.test(path)) {
          throw new FsError(
            `Cannot write to secret/sensitive file: ${path}`,
            "EACCES",
            path,
          );
        }
      }

      if (!this.permission.canWrite) {
        throw new FsError("Workspace is read-only", "EROFS", path);
      }
    }
  }

  private touchWorkspace(): void {
    if (this.activeWorkspace) {
      this.activeWorkspace.lastActiveAt = Date.now();
    }
  }

  private invalidateTreeCache(): void {
    this.treeCache = null;
  }

  private addToRecent(metadata: WorkspaceMetadata): void {
    // Remove if already in list
    this.recentWorkspaces = this.recentWorkspaces.filter(
      (w) => w.root !== metadata.root,
    );

    // Add to front
    this.recentWorkspaces.unshift(metadata);

    // Keep max 10
    if (this.recentWorkspaces.length > 10) {
      this.recentWorkspaces = this.recentWorkspaces.slice(0, 10);
    }
  }

  private emit(event: string, data: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error("[WorkspaceManager] Event listener error:", err);
      }
    }
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────

/**
 * Extract workspace display name from root path.
 */
function extractWorkspaceName(root: string): string {
  const normalized = root.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? root;
}

/**
 * Simple glob pattern to regex conversion (supports ** and *).
 */
function globToRegex(pattern: string): RegExp {
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "⟨GLOBSTAR⟩")
    .replace(/\*/g, "[^/]*")
    .replace(/⟨GLOBSTAR⟩/g, ".*")
    .replace(/\?/g, "[^/]");
  return new RegExp(`^${regexStr}$`);
}
