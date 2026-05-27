/**
 * IDE Context — provides shared IDE state to all components.
 *
 * Uses React Context to share:
 * - EditorManager (editor tabs, models, content)
 * - WorkspaceManager (file system, workspace tree)
 * - TerminalSessionManager (terminal sessions)
 * - AutoSaveManager (debounced auto-save)
 * - UndoRedoManager (operation history)
 * - CommandPolicyGuard (command safety)
 * - AgentOrchestrator (agent runtime, chat/plan/act modes)
 */

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { EditorManager } from "@webassembly-ide/editor";
import {
  WorkspaceManager,
  TerminalSessionManager,
  CommandPolicyGuard,
  AutoSaveManager,
  UndoRedoManager,
} from "@webassembly-ide/ide-core";
import {
  AgentOrchestrator,
  AgentSession,
  AgentUndoManagerAdapter,
} from "@webassembly-ide/agent-runtime";
import { GitService } from "./services/GitService.js";
import { githubAuth, type GitHubAuthService } from "./services/GitHubAuth.js";
import {
  createDefaultFileSystemAdapter,
  type IDEFileSystemAdapter,
} from "./platform/file-system-adapter.js";
import { AccessibilityManager } from "@webassembly-ide/accessibility";
import { I18n, createDefaultI18n } from "@webassembly-ide/i18n";

/** IDE context value */
export interface IDEContextValue {
  editor: EditorManager;
  workspace: WorkspaceManager;
  fileSystem: IDEFileSystemAdapter;
  terminal: TerminalSessionManager;
  commandPolicy: CommandPolicyGuard;
  autoSave: AutoSaveManager;
  undoRedo: UndoRedoManager;
  agent: AgentOrchestrator;
  git: GitService;
  githubAuth: GitHubAuthService;
  accessibility: AccessibilityManager;
  i18n: I18n;
}

const IDEContext = createContext<IDEContextValue | null>(null);

/** Hook to access IDE context */
export function useIDE(): IDEContextValue {
  const ctx = useContext(IDEContext);
  if (!ctx) {
    throw new Error("useIDE must be used within an IDEProvider");
  }
  return ctx;
}

/** IDE Provider — initializes and provides all IDE managers */
export function IDEProvider({ children }: { children: ReactNode }) {
  const editorRef = useRef<EditorManager | null>(null);
  const fileSystemRef = useRef<IDEFileSystemAdapter | null>(null);
  const workspaceRef = useRef<WorkspaceManager | null>(null);
  const terminalRef = useRef<TerminalSessionManager | null>(null);
  const commandPolicyRef = useRef<CommandPolicyGuard | null>(null);
  const autoSaveRef = useRef<AutoSaveManager | null>(null);
  const undoRedoRef = useRef<UndoRedoManager | null>(null);
  const agentRef = useRef<AgentOrchestrator | null>(null);
  const gitRef = useRef<GitService | null>(null);
  const accessibilityRef = useRef<AccessibilityManager | null>(null);
  const i18nRef = useRef<I18n | null>(null);

  // Initialize managers once
  if (!editorRef.current) {
    editorRef.current = new EditorManager();
  }
  if (!fileSystemRef.current) {
    fileSystemRef.current = createDefaultFileSystemAdapter();
  }
  if (!workspaceRef.current) {
    workspaceRef.current = new WorkspaceManager(fileSystemRef.current!);
  }
  if (!terminalRef.current) {
    terminalRef.current = new TerminalSessionManager();
  }
  if (!commandPolicyRef.current) {
    commandPolicyRef.current = new CommandPolicyGuard();
  }
  if (!autoSaveRef.current) {
    autoSaveRef.current = new AutoSaveManager(
      { debounceMs: 1000, enabled: false },
      async (uri) => {
        const editor = editorRef.current;
        const workspace = workspaceRef.current;
        if (editor && workspace) {
          const content = editor.models.getContent(uri);
          if (content !== undefined) {
            await workspace.writeFile(uri, { content });
            editor.markSaved(uri);
          }
        }
      },
    );
  }
  if (!undoRedoRef.current) {
    undoRedoRef.current = new UndoRedoManager();
  }
  if (!agentRef.current) {
    const session = new AgentSession({
      id: `session-${Date.now()}`,
      mode: "chat",
      permissionLevel: "observe",
    });
    agentRef.current = new AgentOrchestrator({
      session,
      undoAdapter: new AgentUndoManagerAdapter({
        undoRedo: undoRedoRef.current!,
        fileAdapter: {
          writeFile: async (path, content) => {
            await workspaceRef.current!.writeFile(path, { content });
          },
        },
      }),
      toolExecutor: async () => ({
        success: false,
        output: "Tool executor not configured",
      }),
      llmCompleter: async () => ({ content: "LLM completer not configured" }),
    });
  }

  if (!gitRef.current) {
    gitRef.current = new GitService(workspaceRef.current!);
    // Wire HTTPS git auth (push/pull/fetch) to the GitHub credentials store.
    gitRef.current.setAuthProvider(() => githubAuth.asGitHttpAuth());
  }
  if (!accessibilityRef.current) {
    accessibilityRef.current = new AccessibilityManager();
  }
  if (!i18nRef.current) {
    i18nRef.current = createDefaultI18n({
      defaultLocale:
        (typeof navigator !== "undefined" && navigator.language?.split("-")[0]) ||
        "en",
      fallbackLocale: "en",
    });
  }

  // Wire auto-save to editor dirty state changes
  useEffect(() => {
    const editor = editorRef.current!;
    const autoSave = autoSaveRef.current!;

    const disposable = editor.models.onDirtyStateChanged((uri, isDirty) => {
      if (isDirty) {
        autoSave.markDirty(uri);
      }
    });

    return () => disposable.dispose();
  }, []);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      editorRef.current?.dispose();
      workspaceRef.current?.dispose();
      terminalRef.current?.dispose();
      autoSaveRef.current?.dispose();
      undoRedoRef.current?.dispose();
      accessibilityRef.current?.dispose();
      gitRef.current?.dispose();
      // AgentOrchestrator doesn't have dispose()
    };
  }, []);

  const value: IDEContextValue = {
    editor: editorRef.current!,
    workspace: workspaceRef.current!,
    fileSystem: fileSystemRef.current!,
    terminal: terminalRef.current!,
    commandPolicy: commandPolicyRef.current!,
    autoSave: autoSaveRef.current!,
    undoRedo: undoRedoRef.current!,
    agent: agentRef.current!,
    git: gitRef.current!,
    githubAuth,
    accessibility: accessibilityRef.current!,
    i18n: i18nRef.current!,
  };

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
}
