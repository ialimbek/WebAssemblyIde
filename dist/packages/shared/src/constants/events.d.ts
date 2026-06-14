/** All event names used across the application */
export declare const EventNames: {
    readonly FILE_OPENED: "file:opened";
    readonly FILE_CLOSED: "file:closed";
    readonly FILE_CHANGED: "file:changed";
    readonly FILE_SAVED: "file:saved";
    readonly FILE_DELETED: "file:deleted";
    readonly WORKSPACE_OPENED: "workspace:opened";
    readonly WORKSPACE_CLOSED: "workspace:closed";
    readonly WORKSPACE_TREE_UPDATED: "workspace:treeUpdated";
    readonly TERMINAL_OPENED: "terminal:opened";
    readonly TERMINAL_CLOSED: "terminal:closed";
    readonly TERMINAL_OUTPUT: "terminal:output";
    readonly AGENT_MESSAGE: "agent:message";
    readonly AGENT_PLAN: "agent:plan";
    readonly AGENT_ACTION: "agent:action";
    readonly AGENT_ERROR: "agent:error";
    readonly DIAGNOSTICS_UPDATED: "diagnostics:updated";
    readonly BROWSER_NAVIGATION: "browser:navigation";
    readonly BROWSER_CONSOLE: "browser:console";
    readonly SCRATCHPAD_EXECUTED: "scratchpad:executed";
};
export type EventName = (typeof EventNames)[keyof typeof EventNames];
//# sourceMappingURL=events.d.ts.map