import {
  ErrorBoundary,
  AppShell,
  MenuBar,
  StatusBar,
  type MenuDefinition,
} from "@webassembly-ide/ui";
import { APP_NAME, APP_VERSION } from "@webassembly-ide/shared";
import { IDEProvider, useIDE } from "./ide-context.js";
import { ExplorerPanel } from "./components/ExplorerPanel.js";
import { EditorPanel } from "./components/EditorPanel.js";
import { TerminalPanel } from "./components/TerminalPanel.js";
import { AgentPanel } from "./components/AgentPanel.js";
import { SearchPanel } from "./components/SearchPanel.js";
import { Marketplace } from "./components/Marketplace.js";
import { QuickOpen } from "./components/QuickOpen.js";
import { WelcomeScreen } from "./components/WelcomeScreen.js";
import {
  DebugPanel,
  OutputPanel,
  ProblemsPanel,
  SettingsPanel,
  SourceControlPanel,
} from "./components/CorePanels.js";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  NotificationToasts,
  ProgressIndicator,
  type ProgressOperation,
} from "./components/NotificationCenter.js";
import { NotificationManager } from "@webassembly-ide/notifications";
import {
  OpenFileDialog,
  WorkspaceSwitcherDialog,
} from "./components/FileContextMenu.js";

type SideView =
  | "explorer"
  | "search"
  | "marketplace"
  | "sourceControl"
  | "debug"
  | "settings";
type BottomView = "terminal" | "problems" | "output";

/**
 * StatusBarContent — displays real IDE state in the status bar.
 */
function StatusBarContent() {
  const { editor, workspace } = useIDE();
  const [activeInfo, setActiveInfo] = useState<string>("Ready");
  const [dirtyCount, setDirtyCount] = useState(() => editor.getDirtyUris().length);

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
      setDirtyCount(editor.getDirtyUris().length);
    });

    return () => {
      disposable.dispose();
      dirtyDisposable.dispose();
    };
  }, [editor]);

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
  const { terminal, editor, workspace, fileSystem, autoSave, undoRedo } = useIDE();
  const [activityBarCollapsed, setActivityBarCollapsed] = useState(
    () => localStorage.getItem("ide.activityBarCollapsed") === "1",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("ide.sidebarCollapsed") === "1",
  );
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(
    () => localStorage.getItem("ide.bottomCollapsed") === "1",
  );
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(
    () => localStorage.getItem("ide.rightCollapsed") === "1",
  );
  const [zenMode, setZenMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState<"default" | "focus" | "zen">(
    "default",
  );
  const [sideView, setSideView] = useState<SideView>("explorer");
  const [bottomView, setBottomView] = useState<BottomView>("terminal");
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showOpenFile, setShowOpenFile] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(
    () => localStorage.getItem("ide.telemetryDecided") !== "1",
  );
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState("en");
  const [operations, setOperations] = useState<ProgressOperation[]>([]);
  const notificationManager = useMemo(
    () => new NotificationManager({ defaultAutoDismissMs: 4000 }),
    [],
  );
  const [openTabs, setOpenTabs] = useState(() => [...editor.getTabs()]);
  const recentFiles = openTabs.map((tab) => tab.uri);
  const [recentWorkspaces, setRecentWorkspaces] = useState(() => [
    ...workspace.getRecentWorkspaces(),
  ]);

  useEffect(() => {
    const disposable = editor.onTabsChanged((tabs) => {
      setOpenTabs([...tabs]);
    });

    return () => disposable.dispose();
  }, [editor]);

  // Persist panel collapse state
  useEffect(() => {
    localStorage.setItem(
      "ide.activityBarCollapsed",
      activityBarCollapsed ? "1" : "0",
    );
  }, [activityBarCollapsed]);
  useEffect(() => {
    localStorage.setItem("ide.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);
  useEffect(() => {
    localStorage.setItem(
      "ide.bottomCollapsed",
      bottomPanelCollapsed ? "1" : "0",
    );
  }, [bottomPanelCollapsed]);
  useEffect(() => {
    localStorage.setItem("ide.rightCollapsed", rightPanelCollapsed ? "1" : "0");
  }, [rightPanelCollapsed]);

  useEffect(() => {
    const refreshRecentWorkspaces = () => {
      setRecentWorkspaces([...workspace.getRecentWorkspaces()]);
    };

    refreshRecentWorkspaces();
    const disposable = workspace.onEvent((event) => {
      if (event === "workspace:opened" || event === "workspace:closed") {
        refreshRecentWorkspaces();
      }
    });

    return () => disposable.dispose();
  }, [workspace]);

  // Apply layout preset
  const applyPreset = useCallback((preset: "default" | "focus" | "zen") => {
    setLayoutPreset(preset);
    if (preset === "default") {
      setActivityBarCollapsed(false);
      setSidebarCollapsed(false);
      setBottomPanelCollapsed(false);
      setRightPanelCollapsed(false);
      setZenMode(false);
    } else if (preset === "focus") {
      setActivityBarCollapsed(false);
      setSidebarCollapsed(false);
      setBottomPanelCollapsed(true);
      setRightPanelCollapsed(true);
      setZenMode(false);
    } else {
      setActivityBarCollapsed(true);
      setSidebarCollapsed(true);
      setBottomPanelCollapsed(true);
      setRightPanelCollapsed(true);
      setZenMode(true);
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Demo progress operation helper
  const runWithProgress = useCallback((label: string, durationMs = 2000) => {
    const id = `op-${Date.now()}`;
    let progress = 0;
    setOperations((prev) => [
      ...prev,
      {
        id,
        label,
        progress,
        cancellable: true,
        onCancel: () => setOperations((p) => p.filter((o) => o.id !== id)),
      },
    ]);
    const interval = setInterval(() => {
      progress += 10;
      setOperations((prev) =>
        prev.map((o) => (o.id === id ? { ...o, progress } : o)),
      );
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(
          () => setOperations((prev) => prev.filter((o) => o.id !== id)),
          500,
        );
      }
    }, durationMs / 10);
  }, []);

  useEffect(() => {
    const disposable = terminal.onStatusChange(() => {
      // Terminal status changed
    });
    return () => disposable.dispose();
  }, [terminal]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      if (ctrlOrMeta && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setQuickOpenVisible(true);
      }
      if (ctrlOrMeta && event.key === "`") {
        event.preventDefault();
        setBottomPanelCollapsed((value) => !value);
        setBottomView("terminal");
      }
      if (ctrlOrMeta && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSideView("search");
        setSidebarCollapsed(false);
      }
      // Ctrl+G — Go to Line
      if (ctrlOrMeta && event.key.toLowerCase() === "g" && !event.shiftKey) {
        event.preventDefault();
        setQuickOpenVisible(true);
      }
      // Ctrl+Shift+O — Go to Symbol
      if (ctrlOrMeta && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        setQuickOpenVisible(true);
      }
      // F11 — Toggle Fullscreen
      if (event.key === "F11") {
        event.preventDefault();
        toggleFullscreen();
      }
      // Ctrl+K then Z — Zen Mode (simplified: Ctrl+Shift+K)
      if (ctrlOrMeta && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setZenMode((v) => !v);
        applyPreset(zenMode ? "default" : "zen");
      }

      // Ctrl+Z — Undo
      if (ctrlOrMeta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        void undoRedo.undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z — Redo
      if (
        (ctrlOrMeta && event.key.toLowerCase() === "y") ||
        (ctrlOrMeta && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        void undoRedo.redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undoRedo]);

  const openFile = useCallback(
    async (path: string) => {
      try {
        const result = await workspace.readFile(path);
        editor.openFile(path, result.content, { asPreview: false });
      } catch (err) {
        notificationManager.error(
          err instanceof Error ? err.message : "Failed to open file",
          { title: "Open File" },
        );
      }
    },
    [workspace, editor, notificationManager],
  );

  const openWorkspaceRoot = useCallback(
    async (root: string) => {
      const prepared = await fileSystem.prepareWorkspace(root);
      await workspace.openWorkspace({
        root: prepared.root,
        name: prepared.name,
        type: fileSystem.kind === "tauri" ? "local" : "virtual",
      });
      editor.closeAllTabs();
      setSideView("explorer");
      setSidebarCollapsed(false);
      notificationManager.success(`Opened workspace: ${prepared.name}`, {
        title: "Workspace",
      });
    },
    [editor, fileSystem, notificationManager, workspace],
  );

  // File menu handlers
  const handleOpenFolder = useCallback(async () => {
    try {
      const root = await fileSystem.pickWorkspaceRoot();
      if (!root) return;
      await openWorkspaceRoot(root);
    } catch (err) {
      notificationManager.error(
        err instanceof Error ? err.message : "Failed to open workspace",
        { title: "Open Folder" },
      );
    }
  }, [fileSystem, notificationManager, openWorkspaceRoot]);

  const handleOpenFile = useCallback(async () => {
    if (!fileSystem.supportsNativePickers) {
      setShowOpenFile(true);
      return;
    }

    try {
      const picked = await fileSystem.pickFile();
      if (!picked) return;
      editor.openFile(picked.path, picked.content, { asPreview: false });
      notificationManager.success(`Opened ${picked.name}`, {
        title: "Open File",
      });
    } catch (err) {
      notificationManager.error(
        err instanceof Error ? err.message : "Failed to open file",
        { title: "Open File" },
      );
    }
  }, [editor, fileSystem, notificationManager]);

  const handleNewFile = useCallback(async () => {
    const activeWorkspace = workspace.getActiveWorkspace();
    if (!activeWorkspace) {
      notificationManager.info("Open a workspace before creating files.", {
        title: "New File",
      });
      return;
    }

    try {
      let index = 0;
      let filePath = joinPath(activeWorkspace.root, "untitled.ts");
      while (await workspace.exists(filePath)) {
        index += 1;
        filePath = joinPath(activeWorkspace.root, `untitled-${index}.ts`);
      }

      await workspace.writeFile(filePath, { content: "", createDirs: true });
      editor.openFile(filePath, "", { asPreview: false });
      notificationManager.success(`Created ${filePath}`, { title: "New File" });
    } catch (err) {
      notificationManager.error(
        err instanceof Error ? err.message : "Failed to create file",
        { title: "New File" },
      );
    }
  }, [editor, notificationManager, workspace]);

  const saveUri = useCallback(
    async (uri: string) => {
      const content = editor.models.getContent(uri);
      if (content === undefined) {
        throw new Error(`Open editor model not found: ${uri}`);
      }

      await workspace.writeFile(uri, { content, createDirs: true });
      editor.markSaved(uri);
      autoSave.markSaved(uri);
    },
    [autoSave, editor, workspace],
  );

  const handleSaveAll = useCallback(async () => {
    const dirtyUris = editor.getDirtyUris();
    if (dirtyUris.length === 0) {
      notificationManager.info("No dirty files to save.", { title: "Save All" });
      return;
    }

    try {
      for (const uri of dirtyUris) {
        await saveUri(uri);
      }
      notificationManager.success(`Saved ${dirtyUris.length} file(s).`, {
        title: "Save All",
      });
    } catch (err) {
      notificationManager.error(
        err instanceof Error ? err.message : "Failed to save files",
        { title: "Save All" },
      );
    }
  }, [editor, notificationManager, saveUri]);

  const handleSaveCurrent = useCallback(async () => {
    const activeUri = editor.getActiveUri();
    if (!activeUri) {
      notificationManager.info("No active file to save.", { title: "Save" });
      return;
    }

    try {
      await saveUri(activeUri);
      notificationManager.success(`Saved ${activeUri}`, { title: "Save" });
    } catch (err) {
      notificationManager.error(
        err instanceof Error ? err.message : "Failed to save file",
        { title: "Save" },
      );
    }
  }, [editor, notificationManager, saveUri]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      if (ctrlOrMeta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (event.shiftKey) {
          void handleSaveAll();
        } else {
          void handleSaveCurrent();
        }
      }

      if (ctrlOrMeta && event.key.toLowerCase() === "o" && !event.shiftKey) {
        event.preventDefault();
        void handleOpenFile();
      }

      if (ctrlOrMeta && event.key.toLowerCase() === "n") {
        event.preventDefault();
        void handleNewFile();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNewFile, handleOpenFile, handleSaveAll, handleSaveCurrent]);

  const handleNewTerminal = useCallback(() => {
    terminal.createSession({ type: "user", label: "New Terminal" });
    setBottomView("terminal");
    setBottomPanelCollapsed(false);
  }, [terminal]);

  const menus: MenuDefinition[] = [
    {
      id: "file",
      label: "File",
      items: [
        {
          id: "file.new",
          label: "New File",
          shortcut: "Ctrl+N",
          onSelect: () => void handleNewFile(),
        },
        {
          id: "file.open",
          label: "Open File…",
          shortcut: "Ctrl+O",
          onSelect: () => void handleOpenFile(),
        },
        {
          id: "file.openFolder",
          label: "Open Folder…",
          onSelect: () => void handleOpenFolder(),
        },
        { id: "file.separator.1", label: "", kind: "separator" },
        {
          id: "file.save",
          label: "Save",
          shortcut: "Ctrl+S",
          onSelect: () => void handleSaveCurrent(),
        },
        {
          id: "file.saveAll",
          label: "Save All",
          shortcut: "Ctrl+Shift+S",
          onSelect: () => void handleSaveAll(),
        },
        { id: "file.separator.2", label: "", kind: "separator" },
        {
          id: "file.recent",
          label: "Open Recent…",
          onSelect: () => setShowWorkspaceSwitcher(true),
        },
        { id: "file.separator.3", label: "", kind: "separator" },
        { id: "file.exit", label: "Exit" },
      ],
    },
    {
      id: "edit",
      label: "Edit",
      items: [
        {
          id: "edit.undo",
          label: "Undo",
          shortcut: "Ctrl+Z",
          onSelect: () => void undoRedo.undo(),
        },
        {
          id: "edit.redo",
          label: "Redo",
          shortcut: "Ctrl+Y",
          onSelect: () => void undoRedo.redo(),
        },
        { id: "edit.separator.1", label: "", kind: "separator" },
        { id: "edit.cut", label: "Cut", shortcut: "Ctrl+X" },
        { id: "edit.copy", label: "Copy", shortcut: "Ctrl+C" },
        { id: "edit.paste", label: "Paste", shortcut: "Ctrl+V" },
        { id: "edit.separator.2", label: "", kind: "separator" },
        { id: "edit.find", label: "Find", shortcut: "Ctrl+F" },
        { id: "edit.replace", label: "Replace", shortcut: "Ctrl+H" },
        { id: "edit.separator.3", label: "", kind: "separator" },
        {
          id: "edit.findInFiles",
          label: "Find in Files",
          shortcut: "Ctrl+Shift+F",
          onSelect: () => {
            setSideView("search");
            setSidebarCollapsed(false);
          },
        },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        {
          id: "view.quickOpen",
          label: "Quick Open",
          shortcut: "Ctrl+P",
          onSelect: () => setQuickOpenVisible(true),
        },
        {
          id: "view.explorer",
          label: "Explorer",
          shortcut: "Ctrl+Shift+E",
          onSelect: () => {
            setSideView("explorer");
            setSidebarCollapsed(false);
          },
        },
        {
          id: "view.search",
          label: "Search",
          shortcut: "Ctrl+Shift+F",
          onSelect: () => {
            setSideView("search");
            setSidebarCollapsed(false);
          },
        },
        { id: "view.separator.1", label: "", kind: "separator" },
        {
          id: "view.terminal",
          label: "Terminal",
          shortcut: "Ctrl+`",
          onSelect: () => {
            setBottomView("terminal");
            setBottomPanelCollapsed(false);
          },
        },
        {
          id: "view.problems",
          label: "Problems",
          shortcut: "Ctrl+Shift+M",
          onSelect: () => {
            setBottomView("problems");
            setBottomPanelCollapsed(false);
          },
        },
        {
          id: "view.output",
          label: "Output",
          onSelect: () => {
            setBottomView("output");
            setBottomPanelCollapsed(false);
          },
        },
        { id: "view.separator.2", label: "", kind: "separator" },
        {
          id: "view.sourceControl",
          label: "Source Control",
          shortcut: "Ctrl+Shift+G",
          onSelect: () => {
            setSideView("sourceControl");
            setSidebarCollapsed(false);
          },
        },
        {
          id: "view.debug",
          label: "Debug",
          shortcut: "Ctrl+Shift+D",
          onSelect: () => {
            setSideView("debug");
            setSidebarCollapsed(false);
          },
        },
        {
          id: "view.extensions",
          label: "Extensions",
          shortcut: "Ctrl+Shift+X",
          onSelect: () => {
            setSideView("marketplace");
            setSidebarCollapsed(false);
          },
        },
        {
          id: "view.settings",
          label: "Settings",
          shortcut: "Ctrl+,",
          onSelect: () => {
            setSideView("settings");
            setSidebarCollapsed(false);
          },
        },
        { id: "view.separator.3", label: "", kind: "separator" },
        {
          id: "view.agent",
          label: "Toggle Agent Panel",
          shortcut: "Ctrl+Shift+A",
          onSelect: () => setRightPanelCollapsed((value) => !value),
        },
        { id: "view.separator.4", label: "", kind: "separator" },
        {
          id: "view.fullscreen",
          label: isFullscreen ? "Exit Full Screen" : "Full Screen",
          shortcut: "F11",
          onSelect: toggleFullscreen,
        },
        {
          id: "view.zenMode",
          label: zenMode ? "Exit Zen Mode" : "Zen Mode",
          shortcut: "Ctrl+Shift+K",
          onSelect: () => applyPreset(zenMode ? "default" : "zen"),
        },
        { id: "view.separator.5", label: "", kind: "separator" },
        {
          id: "view.preset.default",
          label: "Layout: Default",
          onSelect: () => applyPreset("default"),
          kind: "checkbox",
          checked: layoutPreset === "default",
        },
        {
          id: "view.preset.focus",
          label: "Layout: Focus",
          onSelect: () => applyPreset("focus"),
          kind: "checkbox",
          checked: layoutPreset === "focus",
        },
        {
          id: "view.preset.zen",
          label: "Layout: Zen",
          onSelect: () => applyPreset("zen"),
          kind: "checkbox",
          checked: layoutPreset === "zen",
        },
      ],
    },
    {
      id: "go",
      label: "Go",
      items: [
        {
          id: "go.file",
          label: "Go to File…",
          shortcut: "Ctrl+P",
          onSelect: () => setQuickOpenVisible(true),
        },
        {
          id: "go.symbol",
          label: "Go to Symbol…",
          shortcut: "Ctrl+Shift+O",
          onSelect: () => setQuickOpenVisible(true),
        },
        {
          id: "go.line",
          label: "Go to Line…",
          shortcut: "Ctrl+G",
          onSelect: () => setQuickOpenVisible(true),
        },
        { id: "go.separator.1", label: "", kind: "separator" },
        { id: "go.definition", label: "Go to Definition", shortcut: "F12" },
        {
          id: "go.references",
          label: "Go to References",
          shortcut: "Shift+F12",
        },
        { id: "go.separator.2", label: "", kind: "separator" },
        { id: "go.back", label: "Go Back", shortcut: "Alt+Left" },
        { id: "go.forward", label: "Go Forward", shortcut: "Alt+Right" },
      ],
    },
    {
      id: "run",
      label: "Run",
      items: [
        {
          id: "run.start",
          label: "Start Debugging",
          shortcut: "F5",
          onSelect: () => {
            setSideView("debug");
            setSidebarCollapsed(false);
          },
        },
        { id: "run.run", label: "Run Without Debugging", shortcut: "Ctrl+F5" },
        { id: "run.stop", label: "Stop Debugging", shortcut: "Shift+F5" },
        { id: "run.separator.1", label: "", kind: "separator" },
        {
          id: "run.restart",
          label: "Restart Debugging",
          shortcut: "Ctrl+Shift+F5",
        },
      ],
    },
    {
      id: "terminal",
      label: "Terminal",
      items: [
        {
          id: "terminal.new",
          label: "New Terminal",
          shortcut: "Ctrl+Shift+`",
          onSelect: handleNewTerminal,
        },
        { id: "terminal.split", label: "Split Terminal" },
        { id: "terminal.kill", label: "Kill Terminal" },
        { id: "terminal.separator.1", label: "", kind: "separator" },
        { id: "terminal.tasks", label: "Run Task…" },
        {
          id: "terminal.buildTask",
          label: "Run Build Task…",
          shortcut: "Ctrl+Shift+B",
        },
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [
        {
          id: "help.welcome",
          label: "Welcome",
          onSelect: () => {
            setQuickOpenVisible(false);
          },
        },
        {
          id: "help.about",
          label: `About ${APP_NAME}`,
          onSelect: () => setShowAbout(true),
        },
        { id: "help.separator.1", label: "", kind: "separator" },
        { id: "help.docs", label: "Documentation" },
        {
          id: "help.issue",
          label: "Report Issue",
          onSelect: () => setShowErrorReport(true),
        },
        { id: "help.separator.2", label: "", kind: "separator" },
        {
          id: "help.shortcuts",
          label: "Keyboard Shortcuts Reference",
          shortcut: "Ctrl+K Ctrl+S",
          onSelect: () => {
            setSideView("settings");
            setSidebarCollapsed(false);
          },
        },
        {
          id: "help.accessibility",
          label: "Accessibility",
          onSelect: () => setShowAccessibility(true),
        },
        {
          id: "help.language",
          label: "Language…",
          onSelect: () => setShowLanguage(true),
        },
        {
          id: "help.telemetry",
          label: "Telemetry Settings…",
          onSelect: () => setShowTelemetry(true),
        },
        { id: "help.separator.3", label: "", kind: "separator" },
        {
          id: "help.progress",
          label: "Demo: Show Progress Bar",
          onSelect: () => runWithProgress("Building project…"),
        },
        {
          id: "help.notification",
          label: "Demo: Show Notification",
          onSelect: () => {
            notificationManager.success("Build succeeded", { title: "Build" });
          },
        },
      ],
    },
  ];

  const sidebar =
    sideView === "search" ? (
      <SearchPanel onOpenFile={(path) => void openFile(path)} />
    ) : sideView === "marketplace" ? (
      <Marketplace />
    ) : sideView === "sourceControl" ? (
      <SourceControlPanel />
    ) : sideView === "debug" ? (
      <DebugPanel />
    ) : sideView === "settings" ? (
      <SettingsPanel />
    ) : (
      <ExplorerPanel />
    );

  const bottomPanel =
    bottomView === "problems" ? (
      <ProblemsPanel />
    ) : bottomView === "output" ? (
      <OutputPanel />
    ) : (
      <TerminalPanel />
    );

  return (
    <>
      <AppShell
        menuBar={<MenuBar menus={menus} title={`${APP_NAME} ${APP_VERSION}`} />}
        activityBar={
          <ActivityBar
            active={sideView}
            onSelect={(view) => {
              setSideView(view);
              setSidebarCollapsed(false);
            }}
          />
        }
        activityBarCollapsed={activityBarCollapsed}
        sidebarCollapsed={sidebarCollapsed}
        bottomPanelCollapsed={bottomPanelCollapsed}
        rightPanelCollapsed={rightPanelCollapsed}
        onToggleActivityBar={() => setActivityBarCollapsed((value) => !value)}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onToggleBottomPanel={() => setBottomPanelCollapsed((value) => !value)}
        onToggleRightPanel={() => setRightPanelCollapsed((value) => !value)}
        sidebar={sidebar}
        editor={
          openTabs.length > 0 ? (
            <EditorPanel />
          ) : (
            <WelcomeScreen
              recentFiles={recentFiles}
              onNewFile={() => void handleNewFile()}
              onOpenFolder={() => void handleOpenFolder()}
              onOpenFile={() => void handleOpenFile()}
              onOpenQuickOpen={() => setQuickOpenVisible(true)}
              onOpenMarketplace={() => {
                setSideView("marketplace");
                setSidebarCollapsed(false);
              }}
            />
          )
        }
        bottomPanel={bottomPanel}
        rightPanel={<AgentPanel />}
        statusBar={<StatusBarContent />}
      />
      {quickOpenVisible && (
        <QuickOpen
          recentFiles={recentFiles}
          onOpenFile={(path) => void openFile(path)}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}
      {/* About dialog */}
      {showAbout && (
        <div
          role="dialog"
          aria-label={`About ${APP_NAME}`}
          style={overlayStyle}
          onClick={() => setShowAbout(false)}
        >
          <div style={dialogBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 8px", color: "#ffffff" }}>{APP_NAME}</h2>
            <p style={{ margin: "0 0 4px", opacity: 0.7 }}>
              Version {APP_VERSION}
            </p>
            <p style={{ margin: "0 0 16px", opacity: 0.5, fontSize: 12 }}>
              Next-generation, AI-native IDE
            </p>
            <button
              type="button"
              onClick={() => setShowAbout(false)}
              style={primaryBtnStyle}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Open File dialog */}
      {showOpenFile && (
        <OpenFileDialog
          onOpen={(name, content) => {
            const activeRoot = workspace.getActiveWorkspace()?.root;
            const uri = activeRoot ? joinPath(activeRoot, name) : `/virtual/${name}`;
            editor.openFile(uri, content, { asPreview: false });
          }}
          onClose={() => setShowOpenFile(false)}
        />
      )}

      {/* Workspace Switcher dialog */}
      {showWorkspaceSwitcher && (
        <WorkspaceSwitcherDialog
          recentWorkspaces={recentWorkspaces}
          onOpenFolder={() => void handleOpenFolder()}
          onSwitch={(root) => void openWorkspaceRoot(root)}
          onClose={() => setShowWorkspaceSwitcher(false)}
        />
      )}

      {/* Telemetry opt-in dialog */}
      {showTelemetry && (
        <div
          role="dialog"
          aria-label="Telemetry"
          style={overlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              localStorage.setItem("ide.telemetryDecided", "1");
              setShowTelemetry(false);
            }
          }}
        >
          <div style={dialogBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#e8e8e8" }}>
              Help Improve {APP_NAME}
            </h3>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                color: "#cccccc",
                lineHeight: 1.6,
              }}
            >
              Would you like to send anonymous usage data to help us improve the
              IDE? No code, file paths, or personal information is collected.
            </p>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("ide.telemetryDecided", "1");
                  localStorage.setItem("ide.telemetryEnabled", "0");
                  setShowTelemetry(false);
                }}
                style={secondaryBtnStyle}
              >
                No Thanks
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("ide.telemetryDecided", "1");
                  localStorage.setItem("ide.telemetryEnabled", "1");
                  setShowTelemetry(false);
                  notificationManager.success("Telemetry enabled. Thank you!");
                }}
                style={primaryBtnStyle}
              >
                Enable Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility dialog */}
      {showAccessibility && (
        <div
          role="dialog"
          aria-label="Accessibility"
          style={overlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAccessibility(false);
          }}
        >
          <div
            style={{ ...dialogBoxStyle, minWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#e8e8e8" }}>
              Accessibility
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "#cccccc",
                }}
              >
                <span>High Contrast Theme</span>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  style={{ accentColor: "#007acc" }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "#cccccc",
                }}
              >
                <span>Reduce Motion</span>
                <input type="checkbox" style={{ accentColor: "#007acc" }} />
              </label>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "#cccccc",
                }}
              >
                <span>Screen Reader Optimized</span>
                <input type="checkbox" style={{ accentColor: "#007acc" }} />
              </label>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  color: "#cccccc",
                }}
              >
                <span>Keyboard Navigation Only</span>
                <input type="checkbox" style={{ accentColor: "#007acc" }} />
              </label>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setShowAccessibility(false)}
                style={primaryBtnStyle}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language selector dialog */}
      {showLanguage && (
        <div
          role="dialog"
          aria-label="Language"
          style={overlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLanguage(false);
          }}
        >
          <div
            style={{ ...dialogBoxStyle, minWidth: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#e8e8e8" }}>
              Display Language
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { code: "en", label: "English" },
                { code: "tr", label: "Türkçe" },
                { code: "de", label: "Deutsch" },
                { code: "fr", label: "Français" },
                { code: "zh", label: "中文 (Simplified)" },
                { code: "ja", label: "日本語" },
                { code: "ko", label: "한국어" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    notificationManager.info(
                      `Language set to ${lang.label}. Restart required.`,
                    );
                    setShowLanguage(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: language === lang.code ? "#094771" : "#2d2d2d",
                    border: "1px solid",
                    borderColor: language === lang.code ? "#007acc" : "#454545",
                    borderRadius: 4,
                    color: "#cccccc",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <span style={{ color: "#4ec9b0" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setShowLanguage(false)}
                style={secondaryBtnStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error reporting dialog */}
      {showErrorReport && (
        <div
          role="dialog"
          aria-label="Report Issue"
          style={overlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowErrorReport(false);
          }}
        >
          <div
            style={{ ...dialogBoxStyle, minWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#e8e8e8" }}>
              Report an Issue
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#999999" }}>
              Describe the issue you encountered. Include steps to reproduce if
              possible.
            </p>
            <textarea
              rows={5}
              placeholder="Describe the issue…"
              style={{
                width: "100%",
                background: "#3c3c3c",
                border: "1px solid #555555",
                color: "#cccccc",
                borderRadius: 4,
                padding: "8px",
                fontSize: 13,
                boxSizing: "border-box",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#999999",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ accentColor: "#007acc" }}
                />
                Include system info and logs
              </label>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setShowErrorReport(false)}
                style={secondaryBtnStyle}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowErrorReport(false);
                  notificationManager.success("Issue reported. Thank you!");
                }}
                style={primaryBtnStyle}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zen Mode overlay hint */}
      {zenMode && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9998,
            background: "rgba(0,0,0,0.7)",
            color: "#cccccc",
            borderRadius: 20,
            padding: "4px 16px",
            fontSize: 12,
            pointerEvents: "none",
          }}
        >
          Zen Mode — Press Ctrl+Shift+K or Escape to exit
        </div>
      )}

      {/* Notification toasts */}
      <NotificationToasts manager={notificationManager} />

      {/* Progress indicator */}
      <ProgressIndicator operations={operations} />
    </>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.55)",
};

const dialogBoxStyle: React.CSSProperties = {
  background: "#252526",
  border: "1px solid #454545",
  borderRadius: 8,
  padding: 32,
  minWidth: 320,
  textAlign: "center",
  color: "#cccccc",
  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "6px 24px",
  background: "#0e639c",
  border: "none",
  color: "#fff",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "6px 16px",
  background: "transparent",
  border: "1px solid #555555",
  color: "#cccccc",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};

function joinPath(parent: string, child: string): string {
  return `${parent.replace(/[\\/]+$/, "")}/${child.replace(/^[\\/]+/, "")}`;
}

function ActivityBar({
  active,
  onSelect,
}: {
  active: SideView;
  onSelect: (view: SideView) => void;
}) {
  const items: Array<{ view: SideView; label: string; icon: string }> = [
    { view: "explorer", label: "Explorer", icon: "📁" },
    { view: "search", label: "Search", icon: "🔎" },
    { view: "sourceControl", label: "Source Control", icon: "⑂" },
    { view: "debug", label: "Debug", icon: "▷" },
    { view: "marketplace", label: "Extensions", icon: "▣" },
    { view: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <nav
      aria-label="Activity bar"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {items.map((item) => (
        <button
          key={item.view}
          type="button"
          title={item.label}
          aria-label={item.label}
          aria-pressed={active === item.view}
          onClick={() => onSelect(item.view)}
          style={{
            width: 48,
            height: 48,
            border: 0,
            borderLeft:
              active === item.view
                ? "2px solid #4da3ff"
                : "2px solid transparent",
            background: active === item.view ? "#252526" : "transparent",
            color: "#cccccc",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          {item.icon}
        </button>
      ))}
    </nav>
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
