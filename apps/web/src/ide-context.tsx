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
  InMemoryFsAdapter,
  TerminalSessionManager,
  CommandPolicyGuard,
  AutoSaveManager,
  UndoRedoManager,
} from "@webassembly-ide/ide-core";

/** IDE context value */
export interface IDEContextValue {
  editor: EditorManager;
  workspace: WorkspaceManager;
  terminal: TerminalSessionManager;
  commandPolicy: CommandPolicyGuard;
  autoSave: AutoSaveManager;
  undoRedo: UndoRedoManager;
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
  const workspaceRef = useRef<WorkspaceManager | null>(null);
  const terminalRef = useRef<TerminalSessionManager | null>(null);
  const commandPolicyRef = useRef<CommandPolicyGuard | null>(null);
  const autoSaveRef = useRef<AutoSaveManager | null>(null);
  const undoRedoRef = useRef<UndoRedoManager | null>(null);

  // Initialize managers once
  if (!editorRef.current) {
    editorRef.current = new EditorManager();
  }
  if (!workspaceRef.current) {
    const fs = new InMemoryFsAdapter({
      "/project/README.md":
        "# WebAssemblyIde\n\nA next-generation, AI-native IDE.\n",
      "/project/src/main.ts":
        'import { createApp } from "./app";\n\nconst app = createApp();\napp.start();\n',
      "/project/src/app.ts":
        'export function createApp() {\n  return {\n    start() {\n      console.log("App started");\n    },\n  };\n}\n',
      "/project/package.json":
        '{\n  "name": "project",\n  "version": "1.0.0"\n}\n',
      "/project/tsconfig.json":
        '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "strict": true\n  }\n}\n',
    });
    workspaceRef.current = new WorkspaceManager(fs);
  }
  if (!terminalRef.current) {
    terminalRef.current = new TerminalSessionManager();
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
    };
  }, []);

  const value: IDEContextValue = {
    editor: editorRef.current!,
    workspace: workspaceRef.current!,
    terminal: terminalRef.current!,
    commandPolicy: commandPolicyRef.current!,
    autoSave: autoSaveRef.current!,
    undoRedo: undoRedoRef.current!,
  };

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
}
