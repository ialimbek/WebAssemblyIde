/** All event names used across the application */
export const EventNames = {
    // File events
    FILE_OPENED: "file:opened",
    FILE_CLOSED: "file:closed",
    FILE_CHANGED: "file:changed",
    FILE_SAVED: "file:saved",
    FILE_DELETED: "file:deleted",
    // Workspace events
    WORKSPACE_OPENED: "workspace:opened",
    WORKSPACE_CLOSED: "workspace:closed",
    WORKSPACE_TREE_UPDATED: "workspace:treeUpdated",
    // Terminal events
    TERMINAL_OPENED: "terminal:opened",
    TERMINAL_CLOSED: "terminal:closed",
    TERMINAL_OUTPUT: "terminal:output",
    // Agent events
    AGENT_MESSAGE: "agent:message",
    AGENT_PLAN: "agent:plan",
    AGENT_ACTION: "agent:action",
    AGENT_ERROR: "agent:error",
    // Diagnostics
    DIAGNOSTICS_UPDATED: "diagnostics:updated",
    // Browser
    BROWSER_NAVIGATION: "browser:navigation",
    BROWSER_CONSOLE: "browser:console",
    // Scratchpad
    SCRATCHPAD_EXECUTED: "scratchpad:executed",
};
//# sourceMappingURL=events.js.map