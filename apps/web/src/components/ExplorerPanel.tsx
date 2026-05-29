/**
 * ExplorerPanel — workspace file tree component with right-click context menu.
 */

import { convertMarkdownToHtml, setPreviewHtml } from "./MarkdownPreview.js";
import React, { useState, useEffect, useCallback } from "react";
import { useIDE } from "../ide-context.js";
import type {
  WorkspaceEntry,
  WorkspaceMetadata,
} from "@webassembly-ide/ide-core";
import { FileContextMenu } from "./FileContextMenu.js";

interface ContextMenuState {
  path: string;
  isDirectory: boolean;
  x: number;
  y: number;
}

export interface ExplorerPanelProps {
  onCollapseSidebar?: () => void;
  onOpenTerminal?: () => void;
}

export function ExplorerPanel(props: ExplorerPanelProps = {}) {
  const { onCollapseSidebar, onOpenTerminal } = props;
  const { workspace, editor, fileSystem, terminal } = useIDE();
  const [tree, setTree] = useState<WorkspaceEntry[]>([]);
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceMetadata | null>(() => workspace.getActiveWorkspace());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    const currentWorkspace = workspace.getActiveWorkspace();
    setActiveWorkspace(currentWorkspace);

    if (!currentWorkspace) {
      setTree([]);
      return;
    }

    try {
      const entries = await workspace.listDirectory(currentWorkspace.root, {
        maxDepth: 2,
        includeHidden: false,
      });
      setTree(entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    }
  }, [workspace]);

  useEffect(() => {
    void loadTree();
    const disposable = workspace.onEvent((event) => {
      if (
        event === "workspace:opened" ||
        event === "workspace:closed" ||
        event === "workspace:treeUpdated"
      ) {
        void loadTree();
      }
    });

    return () => disposable.dispose();
  }, [workspace, loadTree]);

  const openWorkspaceFromPicker = useCallback(async () => {
    try {
      const selectedRoot = await fileSystem.pickWorkspaceRoot();
      if (!selectedRoot) return;

      const prepared = await fileSystem.prepareWorkspace(selectedRoot);
      await workspace.openWorkspace({
        root: prepared.root,
        name: prepared.name,
        type: fileSystem.kind === "tauri" ? "local" : "virtual",
      });
      setExpandedDirs(new Set());
      editor.closeAllTabs();
      await loadTree();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open workspace");
    }
  }, [editor, fileSystem, loadTree, workspace]);

  const toggleDir = useCallback(
    async (entry: WorkspaceEntry) => {
      if (!entry.isDirectory) return;

      const willExpand = !expandedDirs.has(entry.path);
      setExpandedDirs((prev) => {
        const next = new Set(prev);
        if (next.has(entry.path)) {
          next.delete(entry.path);
        } else {
          next.add(entry.path);
        }
        return next;
      });

      if (willExpand && entry.children === undefined) {
        try {
          const children = await workspace.listDirectory(entry.path, {
            maxDepth: 1,
            includeHidden: false,
          });
          setTree((prev) => replaceEntryChildren(prev, entry.path, children));
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load directory",
          );
        }
      }
    },
    [expandedDirs, workspace],
  );

  const openFile = async (entry: WorkspaceEntry) => {
    if (entry.isDirectory) {
      await toggleDir(entry);
      return;
    }
    try {
      const result = await workspace.readFile(entry.path);
      editor.openFile(entry.path, result.content, { asPreview: false });
      setSelectedPath(entry.path);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open file");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, entry: WorkspaceEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      path: entry.path,
      isDirectory: entry.isDirectory,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleNewFile = async (parentPath: string, name: string) => {
    const filePath = joinPath(parentPath, name);
    await workspace.writeFile(filePath, { content: "", createDirs: true });
    setExpandedDirs((prev) => new Set(prev).add(parentPath));
    await loadTree();
    editor.openFile(filePath, "", { asPreview: false });
  };

  const handleNewFolder = async (parentPath: string, name: string) => {
    await workspace.createDirectory(joinPath(parentPath, name));
    setExpandedDirs((prev) => new Set(prev).add(parentPath));
    await loadTree();
  };

  const handleRename = async (path: string, newName: string) => {
    const parts = path.split("/");
    parts[parts.length - 1] = newName;
    const newPath = parts.join("/");
    await workspace.renameFile(path, newPath);
    editor.renameFile(path, newPath);
    if (selectedPath === path) setSelectedPath(newPath);
    await loadTree();
  };

  const handleDelete = async (path: string) => {
    await workspace.deleteFile(path);
    editor.closeTab(path);
    if (selectedPath === path) setSelectedPath(null);
    await loadTree();
  };

  const handleHeaderNewFile = async () => {
    if (!activeWorkspace) return;
    const name = window.prompt("New file name", "untitled.ts")?.trim();
    if (!name) return;
    try {
      await handleNewFile(activeWorkspace.root, name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create file");
    }
  };

  const collapseAll = () => {
    setExpandedDirs(new Set());
  };

  const handleCopyPath = (path: string) => {
    void navigator.clipboard.writeText(path);
  };

  const handleCopyRelativePath = (path: string) => {
    const root = activeWorkspace?.root ?? "";
    const relative = path.startsWith(root) ? path.slice(root.length + 1) : path;
    void navigator.clipboard.writeText(relative);
  };

  const handleRevealInExplorer = async (path: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("desktop_reveal_in_explorer", { path });
    } catch {
      // Web cannot open native Explorer directly; keep a useful fallback.
      await navigator.clipboard.writeText(path);
    }
  };

  const handleOpenInTerminal = (path: string) => {
    terminal.createSession({ type: "user", label: `Terminal (${path.split("/").pop() ?? path})`, cwd: path });
    onOpenTerminal?.();
  };

  const handleOpenPreview = async (path: string) => {
    try {
      const result = await workspace.readFile(path);
      const fileName = path.split("/").pop() || path;
      const html = convertMarkdownToHtml(result.content);
      const previewUri = "preview:" + path;
      setPreviewHtml(previewUri, html, fileName);
      editor.openFile(previewUri, "", { asPreview: false, title: fileName + " (Preview)" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open preview");
    }
  };

  const renderEntry = (entry: WorkspaceEntry, depth: number): React.ReactNode => {
    const isExpanded = expandedDirs.has(entry.path);
    const isSelected = selectedPath === entry.path;
    const indent = depth * 16;

    return (
      <div key={entry.path}>
        <div
          onClick={() => void openFile(entry)}
          onContextMenu={(e) => handleContextMenu(e, entry)}
          title={entry.path}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "2px 8px",
            paddingLeft: `${8 + indent}px`,
            cursor: "pointer",
            fontSize: "13px",
            color: isSelected ? "#ffffff" : "#cccccc",
            backgroundColor: isSelected
              ? "rgba(0, 122, 204, 0.3)"
              : "transparent",
            borderRadius: "3px",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ marginRight: "4px", fontSize: "11px", width: "14px" }}>
            {entry.isDirectory
              ? isExpanded
                ? "▼"
                : "▶"
              : getFileIcon(entry.extension)}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.name}
          </span>
        </div>
        {entry.isDirectory && isExpanded && entry.children && (
          <div>{entry.children.map((child) => renderEntry(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden",
        fontSize: "13px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>
        {`.ide-explorer-scroll::-webkit-scrollbar{width:10px;height:10px}.ide-explorer-scroll::-webkit-scrollbar-track{background:transparent}.ide-explorer-scroll::-webkit-scrollbar-thumb{background:#424242;border:2px solid transparent;border-radius:8px;background-clip:content-box}.ide-explorer-scroll::-webkit-scrollbar-thumb:hover{background:#5a5a5a;background-clip:content-box}`}
      </style>
      <div
        style={{
          padding: "8px 12px",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "#999999",
          borderBottom: "1px solid #2d2d2d",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span title={activeWorkspace?.root ?? undefined}>
          {activeWorkspace ? activeWorkspace.name : "Explorer"}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {onCollapseSidebar && (
            <button
              type="button"
              title="Collapse Sidebar"
              onClick={onCollapseSidebar}
              style={{
                background: "transparent",
                border: "none",
                color: "#969696",
                cursor: "pointer",
                fontSize: 12,
                padding: "0 2px",
              }}
            >
              ◂
            </button>
          )}
          <button
            type="button"
            title="Open Folder"
            onClick={() => void openWorkspaceFromPicker()}
            style={headerButtonStyle}
          >
            📂
          </button>
          <button
            type="button"
            title="New File"
            disabled={!activeWorkspace}
            onClick={() => void handleHeaderNewFile()}
            style={{
              ...headerButtonStyle,
              opacity: activeWorkspace ? 1 : 0.35,
              cursor: activeWorkspace ? "pointer" : "default",
            }}
          >
            +
          </button>
          <button
            type="button"
            title="Collapse All"
            disabled={!activeWorkspace}
            onClick={collapseAll}
            style={{
              ...headerButtonStyle,
              opacity: activeWorkspace ? 1 : 0.35,
              cursor: activeWorkspace ? "pointer" : "default",
            }}
          >
            ⊟
          </button>
          <button
            type="button"
            title="Refresh"
            disabled={!activeWorkspace}
            onClick={() => void loadTree()}
            style={{
              ...headerButtonStyle,
              opacity: activeWorkspace ? 1 : 0.35,
              cursor: activeWorkspace ? "pointer" : "default",
            }}
          >
            ⟳
          </button>
          <span
            style={{
              fontSize: "10px",
              color: activeWorkspace ? "#4ec9b0" : "#666666",
              display: "flex",
              alignItems: "center",
            }}
          >
            {activeWorkspace ? "●" : "○"}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", color: "#f85149", fontSize: 12 }}>
          {error}
        </div>
      )}

      <div
        className="ide-explorer-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "4px 0",
          scrollbarColor: "#424242 transparent",
          scrollbarWidth: "thin",
        }}
        onContextMenu={(e) => {
          if (e.target === e.currentTarget && activeWorkspace) {
            e.preventDefault();
            setContextMenu({
              path: activeWorkspace.root,
              isDirectory: true,
              x: e.clientX,
              y: e.clientY,
            });
          }
        }}
      >
        {!activeWorkspace ? (
          <div style={{ padding: "12px", color: "#8a8a8a", fontSize: "12px" }}>
            <div style={{ marginBottom: 8 }}>No workspace open.</div>
            <button
              type="button"
              onClick={() => void openWorkspaceFromPicker()}
              style={openFolderButtonStyle}
            >
              Open Folder…
            </button>
          </div>
        ) : tree.length === 0 ? (
          <div style={{ padding: "12px", color: "#666666", fontSize: "12px" }}>
            Workspace is empty or could not be scanned.
          </div>
        ) : (
          tree.map((entry) => renderEntry(entry, 0))
        )}
      </div>

      {contextMenu && (
        <FileContextMenu
          path={contextMenu.path}
          isDirectory={contextMenu.isDirectory}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onNewFile={(parentPath, name) => void handleNewFile(parentPath, name)}
          onNewFolder={(parentPath, name) => void handleNewFolder(parentPath, name)}
          onRename={(path, newName) => void handleRename(path, newName)}
          onDelete={(path) => void handleDelete(path)}
          onCopyPath={handleCopyPath}
          onCopyRelativePath={handleCopyRelativePath}
          onRevealInExplorer={(path) => void handleRevealInExplorer(path)}
          onOpenInTerminal={handleOpenInTerminal}
          onOpenPreview={(path) => void handleOpenPreview(path)}
        />
      )}
    </div>
  );
}

const headerButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#969696",
  cursor: "pointer",
  fontSize: 12,
  padding: "0 2px",
};

const openFolderButtonStyle: React.CSSProperties = {
  background: "#0e639c",
  border: "none",
  color: "#ffffff",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
  padding: "6px 10px",
};

function joinPath(parent: string, child: string): string {
  return `${parent.replace(/[\\/]+$/, "")}/${child.replace(/^[\\/]+/, "")}`;
}

function replaceEntryChildren(
  entries: WorkspaceEntry[],
  path: string,
  children: WorkspaceEntry[],
): WorkspaceEntry[] {
  return entries.map((entry) => {
    if (entry.path === path) {
      return { ...entry, children };
    }

    if (entry.children) {
      return {
        ...entry,
        children: replaceEntryChildren(entry.children, path, children),
      };
    }

    return entry;
  });
}


function getFileIcon(ext?: string): string {
  const icons: Record<string, string> = {
    ts: "📘",
    tsx: "⚛️",
    js: "📙",
    jsx: "⚛️",
    json: "📋",
    html: "🌐",
    css: "🎨",
    md: "📝",
    rs: "🦀",
    py: "🐍",
    toml: "⚙️",
    yml: "⚙️",
    yaml: "⚙️",
  };
  return icons[ext ?? ""] ?? "📄";
}
