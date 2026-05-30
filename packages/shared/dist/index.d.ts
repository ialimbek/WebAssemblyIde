/**
 * @webassembly-ide/shared
 *
 * Shared types, constants, and utility functions for Codembly.
 * This package is the foundation that all other packages depend on.
 */
export type { DeepPartial, Nullable, Optional, AsyncResult, } from "./types/common.js";
export type { EventMap, EventHandler, Disposable } from "./types/events.js";
export type { CommandDefinition, CommandHandler } from "./types/commands.js";
export type { Result, Success, Failure } from "./types/result.js";
export { APP_NAME, APP_VERSION } from "./constants/app.js";
export { EditorCommandIds, WorkspaceCommandIds, TerminalCommandIds, AgentCommandIds, } from "./constants/commands.js";
export { EventNames, type EventName } from "./constants/events.js";
export { PermissionLevel, RiskLevel, RiskLevelMap, } from "./constants/permissions.js";
export { debounce, throttle } from "./utils/timing.js";
export { generateId, shortId } from "./utils/id.js";
export { invariant, assertNever } from "./utils/assert.js";
export { deepClone, deepMerge } from "./utils/object.js";
export { createLogger, type Logger } from "./utils/logger.js";
//# sourceMappingURL=index.d.ts.map