/**
 * @webassembly-ide/ide-core
 *
 * Core IDE runtime — Panel Registry, Layout Manager, Workspace Manager, and File System Abstraction.
 */

// ─── Panel Registry ─────────────────────────────────────────────────────────
export {
  PanelRegistry,
  type PanelDefinition,
  type PanelState,
  type PanelSlot,
} from "./panel-registry.js";

// ─── Layout Manager ─────────────────────────────────────────────────────────
export {
  LayoutManager,
  type LayoutManagerConfig,
  type LayoutRegion,
} from "./layout-manager.js";

// ─── Workspace Types ────────────────────────────────────────────────────────
export type {
  WorkspaceId,
  WorkspaceRoot,
  WorkspaceEntry,
  WorkspaceMetadata,
  WorkspaceType,
  WorkspaceOpenOptions,
  FileReadResult,
  FileWriteOptions,
  PatchOperation,
  PatchEntry,
  ApplyPatchResult,
  PatchError,
  ListDirectoryOptions,
  FileChangeType,
  FileChangeEvent,
  WorkspaceEventMap,
  WorkspacePermission,
} from "./workspace-types.js";

// ─── File System Abstraction ────────────────────────────────────────────────
export {
  InMemoryFsAdapter,
  FsError,
  applyPatchesToContent,
} from "./file-system.js";
export type { FileSystemAdapter } from "./file-system.js";

// ─── Workspace Manager ──────────────────────────────────────────────────────
export { WorkspaceManager } from "./workspace-manager.js";

// ─── Terminal Runtime ───────────────────────────────────────────────────────
export {
  TerminalSessionManager,
  type TerminalSession,
  type TerminalSessionOptions,
  type TerminalOutputChunk,
  type TerminalStatus,
} from "./terminal-runtime.js";
export {
  CommandPolicyGuard,
  type CommandPolicy,
  type CommandPolicyConfig,
  type CommandRiskLevel,
} from "./command-policy.js";

// ─── Auto-save ──────────────────────────────────────────────────────────────
export {
  AutoSaveManager,
  type AutoSaveConfig,
  type SaveCallback,
} from "./auto-save.js";

// ─── Undo/Redo ──────────────────────────────────────────────────────────────
export {
  UndoRedoManager,
  type UndoEntry,
  type UndoTransaction,
  type UndoOperationType,
  type UndoRedoConfig,
} from "./undo-redo.js";

// ─── Theme Manager ──────────────────────────────────────────────────────────
export { ThemeManager } from "./theme-manager.js";
export type {
  ThemeDefinition,
  TokenColorRule,
  ThemeChangeListener,
} from "./theme-manager.js";

// ─── Keybinding Manager ─────────────────────────────────────────────────────
export { KeybindingManager } from "./keybinding-manager.js";
export type {
  Keybinding,
  KeybindingRule,
  KeybindingHandler,
} from "./keybinding-manager.js";

// ─── Marketplace / Extensions ───────────────────────────────────────────────
export { MarketplaceClient } from "./marketplace.js";
export type {
  MarketplaceProvider,
  ExtensionManifest,
  ExtensionManifestContribution,
  MarketplaceExtension,
  MarketplaceSearchOptions,
  MarketplaceClientConfig,
} from "./marketplace.js";
