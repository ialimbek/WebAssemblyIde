import { ErrorBoundary } from "@webassembly-ide/ui";
import { AppShell } from "@webassembly-ide/ui";
import { StatusBar } from "@webassembly-ide/ui";
import { APP_NAME, APP_VERSION } from "@webassembly-ide/shared";
import { IDEProvider, useIDE } from "./ide-context.js";
import { ExplorerPanel } from "./components/ExplorerPanel.js";
import { EditorPanel } from "./components/EditorPanel.js";
import { TerminalPanel } from "./components/TerminalPanel.js";
import { AgentPanel } from "./components/AgentPanel.js";
import { useState, useEffect } from "react";

/**
 * StatusBarContent — displays real IDE state in the status bar.
 */
function StatusBarContent() {
  const { editor, workspace, autoSave } = useIDE();
  const [activeInfo, setActiveInfo] = useState<string>("Ready");
  const [dirtyCount, setDirtyCount] = useState(0);

  useEffect(() => {
    const disposable = editor.onActiveTabChanged(() => {
      const info = editor.getActiveModelInfo();
      if (info) {
        setActiveInfo(
          `${info.fileName} — ${info.languageId} ${info.isReadOnly ? "(read-only)" : ""}`,
        );
      } else {
        setActiveInfo("Ready");
      }
    });

    const dirtyDisposable = editor.models.onDirtyStateChanged(() => {
      setDirtyCount(autoSave.getDirtyCount());
    });

    return () => {
      disposable.dispose();
      dirtyDisposable.dispose();
    };
  }, [editor, autoSave]);

  const ws = workspace.getActiveWorkspace();

  return (
    <StatusBar
      left={
        <span>
          {APP_NAME} v{APP_VERSION}
          {ws ? ` — ${ws.name}` : ""}
        </span>
      }
      right={
        <span>
          {dirtyCount > 0 ? `${dirtyCount} unsaved • ` : ""}
          {activeInfo}
        </span>
      }
    />
  );
}

/**
 * Main App component — renders the IDE shell layout.
 * This is the root of the application.
 */
function AppContent() {
  const { terminal } = useIDE();

  useEffect(() => {
    const disposable = terminal.onStatusChange(() => {
      // Terminal status changed
    });
    return () => disposable.dispose();
  }, [terminal]);

  return (
    <AppShell
      sidebar={<ExplorerPanel />}
      editor={<EditorPanel />}
      bottomPanel={<TerminalPanel />}
      rightPanel={<AgentPanel />}
      statusBar={<StatusBarContent />}
    />
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <IDEProvider>
        <AppContent />
      </IDEProvider>
    </ErrorBoundary>
  );
}
