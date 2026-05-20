/** Editor-related command IDs */
export const EditorCommandIds = {
  OPEN_FILE: "editor.openFile",
  CLOSE_FILE: "editor.closeFile",
  SAVE_FILE: "editor.saveFile",
  SAVE_ALL: "editor.saveAll",
  FORMAT_DOCUMENT: "editor.formatDocument",
  UNDO: "editor.undo",
  REDO: "editor.redo",
} as const;

/** Workspace-related command IDs */
export const WorkspaceCommandIds = {
  OPEN_WORKSPACE: "workspace.openWorkspace",
  CLOSE_WORKSPACE: "workspace.closeWorkspace",
  REFRESH_TREE: "workspace.refreshTree",
  NEW_FILE: "workspace.newFile",
  NEW_FOLDER: "workspace.newFolder",
  DELETE_ITEM: "workspace.deleteItem",
  RENAME_ITEM: "workspace.renameItem",
} as const;

/** Terminal-related command IDs */
export const TerminalCommandIds = {
  OPEN_TERMINAL: "terminal.openTerminal",
  CLOSE_TERMINAL: "terminal.closeTerminal",
  RUN_COMMAND: "terminal.runCommand",
  CLEAR_TERMINAL: "terminal.clearTerminal",
} as const;

/** Agent-related command IDs */
export const AgentCommandIds = {
  OPEN_AGENT: "agent.openAgent",
  SEND_MESSAGE: "agent.sendMessage",
  APPROVE_ACTION: "agent.approveAction",
  REJECT_ACTION: "agent.rejectAction",
  CANCEL_TASK: "agent.cancelTask",
} as const;
