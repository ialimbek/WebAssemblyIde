/**
 * ExplorerPanel — workspace file tree component.
 */

import { useState, useEffect, useCallback } from "react";
import { useIDE } from "../ide-context.js";
import type { WorkspaceEntry } from "@webassembly-ide/ide-core";

export function ExplorerPanel() {
  const { workspace, editor } = useIDE();
  const [tree, setTree] = useState<WorkspaceEntry[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Load workspace tree
  const loadTree = useCallback(async () => {
    if (!workspace.isOpen()) {
      await workspace.openWorkspace({ root: "/project", scanOnOpen: true });
    }
    const entries = await workspace.getTree(2);
    setTree(entries);
  }, [workspace]);

  useEffect(() => {
    loadTree();
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

  const renderEntry = (entry: WorkspaceEntry, depth: number) => {
    const isExpanded = expandedDirs.has(entry.path);
    const isSelected = selectedPath === entry.path;
    const indent = depth * 16;

    return (
      <div key={entry.path}>
        <div
          onClick={() => openFile(entry)}
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
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(255, 255, 255, 0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }
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
          <div>
            {entry.children.map((child) => renderEntry(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: "100%", overflow: "auto", fontSize: "13px" }}>
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
        }}
      >
        <span>Explorer</span>
        <span style={{ fontSize: "10px", color: "#666666" }}>
          {workspace.isOpen() ? "●" : "○"}
        </span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {tree.length === 0 ? (
          <div style={{ padding: "12px", color: "#666666", fontSize: "12px" }}>
            No workspace open
          </div>
        ) : (
          tree.map((entry) => renderEntry(entry, 0))
        )}
      </div>
    </div>
  );
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
