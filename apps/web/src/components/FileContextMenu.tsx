/**
 * FileContextMenu — right-click context menu for files/folders in the explorer.
 * Includes reusable dialog components for New File, New Folder, Rename, Delete, Save As, Open File.
 */

import React, { useState, useRef, useEffect } from "react";

/* ─── Dialog type used for state tracking ─────────────────────────────────── */

type DialogState =
  | { kind: "newFile"; parentPath: string }
  | { kind: "newFolder"; parentPath: string }
  | { kind: "rename"; path: string; currentName: string }
  | { kind: "delete"; path: string }
  | null;

/* ─── Context Menu ────────────────────────────────────────────────────────── */

export interface FileContextMenuProps {
  path: string;
  isDirectory: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onNewFile?: (parentPath: string, name: string) => void;
  onNewFolder?: (parentPath: string, name: string) => void;
  onRename?: (path: string, newName: string) => void;
  onDelete?: (path: string) => void;
  onCopy?: (path: string) => void;
  onPaste?: (targetPath: string) => void;
  onOpenInTerminal?: (path: string) => void;
}

export function FileContextMenu({
  path,
  isDirectory,
  x,
  y,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onCopy,
  onPaste,
  onOpenInTerminal,
}: FileContextMenuProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const parentPath = isDirectory
    ? path
    : path.split("/").slice(0, -1).join("/") || "/";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  interface MenuItem {
    label: string;
    shortcut?: string;
    separator?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }

  const items: MenuItem[] = [
    ...(isDirectory
      ? ([
          {
            label: "New File",
            shortcut: "Alt+N",
            onClick: () => setDialog({ kind: "newFile", parentPath }),
          },
          {
            label: "New Folder",
            onClick: () => setDialog({ kind: "newFolder", parentPath }),
          },
          { label: "", separator: true },
        ] as MenuItem[])
      : []),
    {
      label: "Rename",
      shortcut: "F2",
      onClick: () =>
        setDialog({
          kind: "rename",
          path,
          currentName: path.split("/").pop() ?? "",
        }),
    },
    {
      label: "Delete",
      shortcut: "Del",
      onClick: () => setDialog({ kind: "delete", path }),
    },
    { label: "", separator: true },
    {
      label: "Copy",
      shortcut: "Ctrl+C",
      onClick: () => { onCopy?.(path); onClose(); },
    },
    {
      label: "Paste",
      shortcut: "Ctrl+V",
      onClick: () => { onPaste?.(parentPath); onClose(); },
    },
    { label: "", separator: true },
    {
      label: "Open in Terminal",
      onClick: () => { onOpenInTerminal?.(parentPath); onClose(); },
    },
  ];

  if (dialog) {
    return (
      <>
        {dialog.kind === "newFile" && (
          <InputDialog
            title="New File"
            placeholder="filename.ts"
            confirmLabel="Create"
            onConfirm={(name) => { if (name.trim()) onNewFile?.(dialog.parentPath, name.trim()); }}
            onClose={onClose}
          />
        )}
        {dialog.kind === "newFolder" && (
          <InputDialog
            title="New Folder"
            placeholder="folder-name"
            confirmLabel="Create"
            onConfirm={(name) => { if (name.trim()) onNewFolder?.(dialog.parentPath, name.trim()); }}
            onClose={onClose}
          />
        )}
        {dialog.kind === "rename" && (
          <InputDialog
            title="Rename"
            placeholder={dialog.currentName}
            defaultValue={dialog.currentName}
            confirmLabel="Rename"
            onConfirm={(name) => {
              if (name.trim() && name.trim() !== dialog.currentName)
                onRename?.(dialog.path, name.trim());
            }}
            onClose={onClose}
          />
        )}
        {dialog.kind === "delete" && (
          <ConfirmDialog
            title="Delete"
            message={`Are you sure you want to delete "${dialog.path.split("/").pop()}"? This cannot be undone.`}
            confirmLabel="Delete"
            confirmColor="#f44747"
            onConfirm={() => onDelete?.(dialog.path)}
            onClose={onClose}
          />
        )}
      </>
    );
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="File context menu"
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 10000,
        backgroundColor: "#252526",
        border: "1px solid #454545",
        borderRadius: 4,
        minWidth: 200,
        boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
        padding: "4px 0",
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div
            key={i}
            role="separator"
            style={{ height: 1, background: "#333333", margin: "4px 0" }}
          />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={item.onClick}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: "5px 12px",
              border: "none",
              background: "transparent",
              color: item.disabled ? "#666666" : "#cccccc",
              cursor: item.disabled ? "default" : "pointer",
              fontSize: 13,
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled)
                (e.currentTarget as HTMLElement).style.background = "#094771";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span style={{ fontSize: 11, color: "#666666", marginLeft: 24 }}>
                {item.shortcut}
              </span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

/* ─── Shared Dialog Components ───────────────────────────────────────────── */

export interface InputDialogProps {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export function InputDialog({
  title,
  placeholder,
  defaultValue = "",
  confirmLabel,
  onConfirm,
  onClose,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const confirm = () => {
    onConfirm(value);
    onClose();
  };

  return (
    <div role="dialog" aria-label={title} style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#e8e8e8" }}>{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") onClose(); }}
          style={inputStyle}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button type="button" onClick={confirm} style={primaryBtnStyle("#0e639c")}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, confirmColor = "#0e639c", onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <div role="dialog" aria-label={title} style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, color: "#e8e8e8" }}>{title}</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#cccccc", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} style={primaryBtnStyle(confirmColor)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function SaveAsDialog({ currentPath, onSave, onClose }: { currentPath: string; onSave: (path: string) => void; onClose: () => void }) {
  const [path, setPath] = useState(currentPath);
  return (
    <div role="dialog" aria-label="Save As" style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#e8e8e8" }}>Save As</h3>
        <label style={{ fontSize: 12, color: "#999999", display: "block", marginBottom: 6 }}>File path</label>
        <input
          type="text" value={path} onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onSave(path); onClose(); } if (e.key === "Escape") onClose(); }}
          style={inputStyle} autoFocus
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button type="button" onClick={() => { onSave(path); onClose(); }} style={primaryBtnStyle("#0e639c")}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function OpenFileDialog({ onOpen, onClose }: { onOpen: (name: string, content: string) => void; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    onOpen(file.name, content);
    onClose();
  };
  return (
    <div role="dialog" aria-label="Open File" style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#e8e8e8" }}>Open File</h3>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#999999" }}>Select a file from your device to open in the editor.</p>
        <input ref={inputRef} type="file" onChange={handleChange} style={{ display: "none" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button type="button" onClick={() => inputRef.current?.click()} style={primaryBtnStyle("#0e639c")}>Choose File…</button>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSwitcherDialog({
  recentWorkspaces, onSwitch, onClose,
}: {
  recentWorkspaces: Array<{ id: string; name: string; root: string }>;
  onSwitch: (root: string) => void;
  onClose: () => void;
}) {
  return (
    <div role="dialog" aria-label="Switch Workspace" style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...dialogStyle, minWidth: 400 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#e8e8e8" }}>Switch Workspace</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflow: "auto" }}>
          {recentWorkspaces.length === 0 ? (
            <p style={{ fontSize: 12, color: "#666666" }}>No recent workspaces</p>
          ) : (
            recentWorkspaces.map((ws) => (
              <button key={ws.id} type="button" onClick={() => { onSwitch(ws.root); onClose(); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 12px", background: "#2d2d2d", border: "1px solid #454545", borderRadius: 4, cursor: "pointer", color: "#cccccc", textAlign: "left" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#094771"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#2d2d2d"; }}
              >
                <span style={{ fontWeight: "bold", fontSize: 13 }}>{ws.name}</span>
                <span style={{ fontSize: 11, color: "#666666", marginTop: 2 }}>{ws.root}</span>
              </button>
            ))
          )}
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Style Helpers ───────────────────────────────────────────────── */

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 10001, display: "flex",
  alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)",
};

const dialogStyle: React.CSSProperties = {
  background: "#252526", border: "1px solid #454545", borderRadius: 8,
  padding: 24, minWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 10px", background: "#3c3c3c",
  border: "1px solid #555555", borderRadius: 4, color: "#cccccc",
  fontSize: 13, boxSizing: "border-box", outline: "none",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "6px 16px", background: "transparent", border: "1px solid #555555",
  borderRadius: 4, color: "#cccccc", cursor: "pointer", fontSize: 13,
};

function primaryBtnStyle(bg: string): React.CSSProperties {
  return { padding: "6px 16px", background: bg, border: "none", borderRadius: 4, color: "#ffffff", cursor: "pointer", fontSize: 13 };
}
