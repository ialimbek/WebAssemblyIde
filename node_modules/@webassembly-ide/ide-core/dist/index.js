/**
 * @webassembly-ide/ide-core
 *
 * Core IDE runtime — Panel Registry, Layout Manager, Workspace Manager, and File System Abstraction.
 */
// ─── Panel Registry ─────────────────────────────────────────────────────────
export { PanelRegistry, } from "./panel-registry.js";
// ─── Layout Manager ─────────────────────────────────────────────────────────
export { LayoutManager, } from "./layout-manager.js";
// ─── File System Abstraction ────────────────────────────────────────────────
export { InMemoryFsAdapter, FsError, applyPatchesToContent, } from "./file-system.js";
// ─── Workspace Manager ──────────────────────────────────────────────────────
export { WorkspaceManager } from "./workspace-manager.js";
// ─── Terminal Runtime ───────────────────────────────────────────────────────
export { TerminalSessionManager, } from "./terminal-runtime.js";
export { CommandPolicyGuard, } from "./command-policy.js";
// ─── Auto-save ──────────────────────────────────────────────────────────────
export { AutoSaveManager, } from "./auto-save.js";
// ─── Undo/Redo ──────────────────────────────────────────────────────────────
export { UndoRedoManager, } from "./undo-redo.js";
//# sourceMappingURL=index.js.map