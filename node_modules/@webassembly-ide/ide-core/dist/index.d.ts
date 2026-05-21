/**
 * @webassembly-ide/ide-core
 *
 * Core IDE runtime — Panel Registry, Layout Manager, Workspace Manager, and File System Abstraction.
 */
export { PanelRegistry, type PanelDefinition, type PanelState, type PanelSlot, } from "./panel-registry.js";
export { LayoutManager, type LayoutManagerConfig, type LayoutRegion, } from "./layout-manager.js";
export type { WorkspaceId, WorkspaceRoot, WorkspaceEntry, WorkspaceMetadata, WorkspaceType, WorkspaceOpenOptions, FileReadResult, FileWriteOptions, PatchOperation, PatchEntry, ApplyPatchResult, PatchError, ListDirectoryOptions, FileChangeType, FileChangeEvent, WorkspaceEventMap, WorkspacePermission, } from "./workspace-types.js";
export { InMemoryFsAdapter, FsError, applyPatchesToContent, } from "./file-system.js";
export type { FileSystemAdapter } from "./file-system.js";
export { WorkspaceManager } from "./workspace-manager.js";
export { TerminalSessionManager, type TerminalSession, type TerminalSessionOptions, type TerminalOutputChunk, type TerminalStatus, } from "./terminal-runtime.js";
export { CommandPolicyGuard, type CommandPolicy, type CommandPolicyConfig, type CommandRiskLevel, } from "./command-policy.js";
export { AutoSaveManager, type AutoSaveConfig, type SaveCallback, } from "./auto-save.js";
export { UndoRedoManager, type UndoEntry, type UndoTransaction, type UndoOperationType, type UndoRedoConfig, } from "./undo-redo.js";
export { ThemeManager } from "./theme-manager.js";
export type { ThemeDefinition, TokenColorRule, ThemeChangeListener, } from "./theme-manager.js";
export { KeybindingManager } from "./keybinding-manager.js";
export type { Keybinding, KeybindingRule, KeybindingHandler, } from "./keybinding-manager.js";
export { MarketplaceClient } from "./marketplace.js";
export type { MarketplaceProvider, ExtensionManifest, ExtensionManifestContribution, MarketplaceExtension, MarketplaceSearchOptions, MarketplaceClientConfig, } from "./marketplace.js";
//# sourceMappingURL=index.d.ts.map