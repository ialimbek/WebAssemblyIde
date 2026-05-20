/**
 * @webassembly-ide/shared
 *
 * Shared types, constants, and utility functions for WebAssemblyIde.
 * This package is the foundation that all other packages depend on.
 */
// ─── Constants ──────────────────────────────────────────────────────────────
export { APP_NAME, APP_VERSION } from "./constants/app.js";
export { EditorCommandIds, WorkspaceCommandIds, TerminalCommandIds, AgentCommandIds, } from "./constants/commands.js";
export { EventNames } from "./constants/events.js";
export { PermissionLevel, RiskLevel, RiskLevelMap, } from "./constants/permissions.js";
// ─── Utilities ──────────────────────────────────────────────────────────────
export { debounce, throttle } from "./utils/timing.js";
export { generateId, shortId } from "./utils/id.js";
export { invariant, assertNever } from "./utils/assert.js";
export { deepClone, deepMerge } from "./utils/object.js";
export { createLogger } from "./utils/logger.js";
//# sourceMappingURL=index.js.map