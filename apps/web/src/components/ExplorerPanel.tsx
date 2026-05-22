/**
 * ExplorerPanel — workspace file tree component with right-click context menu.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useIDE } from "../ide-context.js";
import type { WorkspaceEntry } from "@webassembly-ide/ide-core";
import { FileContextMenu } from "./FileContextMenu.js";

interface ContextMenuState {
  path: string;
  isDirectory: boolean;
  x: number;
  y: number;
}

export function ExplorerPanel() {
  const { workspace, editor } = useIDE();
  const [tree, setTree] = useState<WorkspaceEntry[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const loadTree = useCallback(async () => {
    if (!workspace.isOpen()) {
      await workspace.openWorkspace({ root: "/project", scanOnOpen: true });
    }
    const entries = await workspace.getTree(2);
    setTree(entries);
  }, [workspace]);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const openFile = async (entry: WorkspaceEntry) => {
    if (entry.isDirectory) {
      toggleDir(entry.path);
      return;
    }
    try {
      const result = await workspace.readFile(entry.path);
      editor.openFile(entry.path, result.content, { asPreview: false });
      setSelectedPath(entry.path);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, entry: WorkspaceEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ path: entry.path, isDirectory: entry.isDirectory, x: e.clientX, y: e.clientY });
  };

  const handleNewFile = async (parentPath: string, name: string) => {
    const filePath = `${parentPath}/${name}`;
    await workspace.writeFile(filePath, { content: "" });
    await loadTree();
    editor.openFile(filePath, "", { asPreview: false });
  };

  const handleNewFolder = async (parentPath: string, name: string) => {
    await workspace.createDirectory(`${parentPath}/${name}`);
    await loadTree();
  };

  const handleRename = async (path: string, newName: string) => {
    const parts = path.split("/");
    parts[parts.length - 1] = newName;
    const newPath = parts.join("/");
    await workspace.renameFile(path, newPath);
    await loadTree();
  };

  const handleDelete = async (path: string) => {
    await workspace.deleteFile(path);
    await loadTree();
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
            display: "flex", alignItems: "center",
            padding: "2px 8px", paddingLeft: `${8 + indent}px`,
            cursor: "pointer", fontSize: "13px",
            color: isSelected ? "#ffffff" : "#cccccc",
            backgroundColor: isSelected ? "rgba(0, 122, 204, 0.3)" : "transparent",
            borderRadius: "3px", userSelect: "none",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          }}
        >
          <span style={{ marginRight: "4px", fontSize: "11px", width: "14px" }}>
            {entry.isDirectory ? (isExpanded ? "▼" : "▶") : getFileIcon(entry.extension)}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
    <div style={{ height: "100%", overflow: "auto", fontSize: "13px", position: "relative" }}>
      <div style={{ padding: "8px 12px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#999999", borderBottom: "1px solid #2d2d2d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Explorer</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            title="New File"
            onClick={() => void handleNewFile("/project", "untitled.ts")}
            style={{ background: "transparent", border: "none", color: "#969696", cursor: "pointer", fontSize: 14, padding: "0 2px" }}
          >+</button>
          <button
            type="button"
            title="Refresh"
            onClick={() => void loadTree()}
            style={{ background: "transparent", border: "none", color: "#969696", cursor: "pointer", fontSize: 12, padding: "0 2px" }}
          >⟳</button>
          <span style={{ fontSize: "10px", color: "#666666", display: "flex", alignItems: "center" }}>
            {workspace.isOpen() ? "●" : "○"}
          </span>
        </div>
      </div>
      <div style={{ padding: "4px 0" }}>
        {tree.length === 0 ? (
          <div style={{ padding: "12px", color: "#666666", fontSize: "12px" }}>No workspace open</div>
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
          onOpenInTerminal={(path) => console.log("Open in terminal:", path)}
        />
      )}
    </div>
  );
}

function getFileIcon(ext?: string): string {
  const icons: Record<string, string> = {
    ts: "📘", tsx: "⚛️", js: "📙", jsx: "⚛️", json: "📋",
    html: "🌐", css: "🎨", md: "📝", rs: "🦀", py: "🐍",
    toml: "⚙️", yml: "⚙️", yaml: "⚙️",
  };
  return icons[ext ?? ""] ?? "📄";
}
