/**
 * Workspace Types — core type definitions for workspace management.
 */

/** Unique workspace identifier */
export type WorkspaceId = string;

/** Workspace root path/URI */
export type WorkspaceRoot = string;

/** File/directory entry in workspace tree */
export interface WorkspaceEntry {
  /** Full path/URI */
  path: string;
  /** File or directory name */
  name: string;
  /** Is this a directory? */
  isDirectory: boolean;
  /** File size in bytes (0 for directories) */
  size: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** File extension (without dot) */
  extension?: string;
  /** Child entries (for directories, if loaded) */
  children?: WorkspaceEntry[];
}

/** Workspace metadata */
export interface WorkspaceMetadata {
  /** Unique workspace ID */
  id: WorkspaceId;
  /** Display name */
  name: string;
  /** Root path */
  root: WorkspaceRoot;
  /** When the workspace was opened */
  openedAt: number;
  /** Last active timestamp */
  lastActiveAt: number;
  /** Whether workspace is currently loaded */
  isLoaded: boolean;
  /** Total file count (when scanned) */
  fileCount?: number;
  /** Workspace type */
  type: WorkspaceType;
}

/** Workspace type */
export type WorkspaceType = "local" | "remote" | "git-backed" | "virtual";

/** Workspace open options */
export interface WorkspaceOpenOptions {
  /** Root path/URI to open */
  root: WorkspaceRoot;
  /** Workspace type */
  type?: WorkspaceType;
  /** Display name override */
  name?: string;
  /** Whether to scan immediately */
  scanOnOpen?: boolean;
}

/** File read result */
export interface FileReadResult {
  /** File content as string */
  content: string;
  /** File encoding used */
  encoding: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** Whether the file was read from cache */
  fromCache: boolean;
}

/** File write options */
export interface FileWriteOptions {
  /** Content to write */
  content: string;
  /** File encoding (default: utf-8) */
  encoding?: string;
  /** Create parent directories if they don't exist */
  createDirs?: boolean;
}

/** Patch operation type */
export type PatchOperation = "insert" | "delete" | "replace";

/** Single patch operation */
export interface PatchEntry {
  /** Operation type */
  op: PatchOperation;
  /** Target file path */
  path: string;
  /** Line range start (1-based) */
  lineStart: number;
  /** Line range end (1-based, inclusive) */
  lineEnd: number;
  /** New content (for insert/replace) */
  content?: string;
}

/** Apply patch result */
export interface ApplyPatchResult {
  /** Whether all patches were applied successfully */
  success: boolean;
  /** List of files that were modified */
  modifiedFiles: string[];
  /** Any errors that occurred */
  errors: PatchError[];
}

/** Patch error */
export interface PatchError {
  /** File path where error occurred */
  path: string;
  /** Error message */
  message: string;
  /** Line number where error occurred */
  line?: number;
}

/** Directory list options */
export interface ListDirectoryOptions {
  /** Maximum depth for recursive listing (0 = immediate children only) */
  maxDepth?: number;
  /** Filter pattern (glob) */
  pattern?: string;
  /** Include hidden files/directories */
  includeHidden?: boolean;
  /** Maximum number of entries to return */
  limit?: number;
}

/** File change event */
export type FileChangeType = "created" | "modified" | "deleted" | "renamed";

/** File change event */
export interface FileChangeEvent {
  /** Type of change */
  type: FileChangeType;
  /** File path that changed */
  path: string;
  /** New path (for renames) */
  newPath?: string;
  /** Timestamp of the change */
  timestamp: number;
}

/** Workspace events */
export interface WorkspaceEventMap {
  "workspace:opened": { metadata: WorkspaceMetadata };
  "workspace:closed": { id: WorkspaceId };
  "workspace:fileChanged": FileChangeEvent;
  "workspace:treeUpdated": { root: WorkspaceRoot };
  "workspace:error": { message: string; path?: string };
}

/** Permission scope for workspace operations */
export interface WorkspacePermission {
  /** Workspace root this permission applies to */
  root: WorkspaceRoot;
  /** Whether writing is allowed */
  canWrite: boolean;
  /** Whether executing commands is allowed */
  canExecute: boolean;
  /** Specific paths that are denied */
  deniedPaths: string[];
  /** Patterns for secret/sensitive files */
  secretPatterns: string[];
}
