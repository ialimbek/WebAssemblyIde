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
import { EditorManager, type EditorConfig } from "@webassembly-ide/editor";
import {
  WorkspaceManager,
  TerminalSessionManager,
  CommandPolicyGuard,
  AutoSaveManager,
  UndoRedoManager,
  ThemeManager,
} from "@webassembly-ide/ide-core";
import {
  AgentOrchestrator,
  AgentSession,
  AgentUndoManagerAdapter,
} from "@webassembly-ide/agent-runtime";
import { GitService } from "./services/GitService.js";
import {
  createDefaultFileSystemAdapter,
  type IDEFileSystemAdapter,
} from "./platform/file-system-adapter.js";
import { AccessibilityManager } from "@webassembly-ide/accessibility";
import { I18n, createDefaultI18n } from "@webassembly-ide/i18n";
import { LazyModuleRegistry, StartupProfiler } from "@webassembly-ide/performance-core";
import { startupProfiler } from "./main.js";

export interface TerminalConfig {
  defaultShell: string;
  fontSize: number;
  fontFamily: string;
  copyOnSelection: boolean;
  scrollbackLines: number;
}

export interface TerminalConfigController {
  getConfig(): TerminalConfig;
  updateConfig(patch: Partial<TerminalConfig>): void;
  onConfigChanged(listener: (config: TerminalConfig) => void): { dispose: () => void };
}

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
  accessibility: AccessibilityManager;
  i18n: I18n;
  theme: ThemeManager;
  terminalConfig: TerminalConfigController;
  performance: {
    profiler: StartupProfiler;
    lazyModules: LazyModuleRegistry;
  };
}

const IDEContext = createContext<IDEContextValue | null>(null);
const EDITOR_CONFIG_STORAGE_KEY = "ide.editor.config";
const TERMINAL_CONFIG_STORAGE_KEY = "ide.terminal.config";

const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  defaultShell: "powershell",
  fontSize: 13,
  fontFamily: "'Cascadia Code', Consolas, monospace",
  copyOnSelection: true,
  scrollbackLines: 1000,
};

function readEditorConfig(): EditorConfig | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const stored = localStorage.getItem(EDITOR_CONFIG_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as EditorConfig) : undefined;
  } catch {
    return undefined;
  }
}

function persistEditorConfig(config: EditorConfig): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(EDITOR_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore storage failures */
  }
}

function readTerminalConfig(): TerminalConfig {
  if (typeof localStorage === "undefined") return DEFAULT_TERMINAL_CONFIG;
  try {
    const stored = localStorage.getItem(TERMINAL_CONFIG_STORAGE_KEY);
    return stored
      ? { ...DEFAULT_TERMINAL_CONFIG, ...(JSON.parse(stored) as Partial<TerminalConfig>) }
      : DEFAULT_TERMINAL_CONFIG;
  } catch {
    return DEFAULT_TERMINAL_CONFIG;
  }
}

function persistTerminalConfig(config: TerminalConfig): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(TERMINAL_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore storage failures */
  }
}

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
  const themeRef = useRef<ThemeManager | null>(null);
  const terminalConfigRef = useRef<TerminalConfig | null>(null);
  const lazyModulesRef = useRef<LazyModuleRegistry | null>(null);
  const terminalConfigListenersRef = useRef(new Set<(config: TerminalConfig) => void>());

  // Initialize managers once
  if (!editorRef.current) {
    editorRef.current = new EditorManager(readEditorConfig());
    editorRef.current.onConfigChanged((config) => persistEditorConfig(config));
  }
  if (!lazyModulesRef.current) {
    lazyModulesRef.current = new LazyModuleRegistry();
    lazyModulesRef.current.register({
      id: "git-service",
      description: "Workspace Git integration",
      loader: async () => gitRef.current ?? new GitService(workspaceRef.current!),
    });
    lazyModulesRef.current.register({
      id: "agent-runtime",
      description: "Agent orchestration runtime",
      loader: async () => agentRef.current,
    });
    lazyModulesRef.current.register({
      id: "terminal-runtime",
      description: "Project terminal runtime",
      loader: async () => terminalRef.current,
    });
    lazyModulesRef.current.register({
      id: "monaco-editor",
      description: "Monaco editor runtime",
      loader: () => import("monaco-editor"),
    });
  }
  if (!themeRef.current) {
    themeRef.current = new ThemeManager();
    const activeTheme = themeRef.current.getActiveTheme();
    themeRef.current.initializeDOM();
    editorRef.current.updateConfig({ theme: activeTheme.id });
    themeRef.current.onThemeChange((theme) => {
      editorRef.current?.updateConfig({ theme: theme.id });
    });
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
  if (!terminalConfigRef.current) {
    terminalConfigRef.current = readTerminalConfig();
  }
  if (!commandPolicyRef.current) {
    commandPolicyRef.current = new CommandPolicyGuard();
  }
  if (!autoSaveRef.current) {
    autoSaveRef.current = new AutoSaveManager(
      { debounceMs: 1000, enabled: true },
      async (uri) => {
        const editor = editorRef.current;
        const workspace = workspaceRef.current;
        const fileSystem = fileSystemRef.current;
        const git = gitRef.current;
        if (editor && workspace) {
          const content = editor.models.getContent(uri);
          if (content !== undefined) {
            fileSystem?.markInternalWrite(uri);
            await workspace.writeFile(uri, { content });
            editor.markSaved(uri);
            git?.triggerRefresh();
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
      } else {
        autoSave.markSaved(uri);
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
      gitRef.current?.dispose();
      lazyModulesRef.current?.dispose();
      accessibilityRef.current?.dispose();
      // AgentOrchestrator doesn't have dispose()
    };
  }, []);

  const terminalConfigController: TerminalConfigController = {
    getConfig: () => terminalConfigRef.current!,
    updateConfig: (patch) => {
      const next = { ...terminalConfigRef.current!, ...patch };
      terminalConfigRef.current = next;
      persistTerminalConfig(next);
      for (const listener of terminalConfigListenersRef.current) {
        listener(next);
      }
    },
    onConfigChanged: (listener) => {
      terminalConfigListenersRef.current.add(listener);
      return { dispose: () => terminalConfigListenersRef.current.delete(listener) };
    },
  };

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
    accessibility: accessibilityRef.current!,
    i18n: i18nRef.current!,
    theme: themeRef.current!,
    terminalConfig: terminalConfigController,
    performance: {
      profiler: startupProfiler,
      lazyModules: lazyModulesRef.current!,
    },
  };

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
}
