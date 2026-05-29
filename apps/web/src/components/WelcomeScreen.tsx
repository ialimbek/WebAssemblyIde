/**
 * WelcomeScreen — rich welcome screen shown when no editor tab is open.
 * Shows recent files, quick actions, tips, and getting-started guide.
 */

import { useState } from "react";

export interface RecentWorkspaceEntry {
  path: string;
  name: string;
  lastOpenedAt?: number;
}

export interface WelcomeScreenProps {
  recentFiles: string[];
  recentWorkspaces?: RecentWorkspaceEntry[];
  onOpenQuickOpen: () => void;
  onOpenMarketplace: () => void;
  onNewFile?: () => void;
  onOpenFolder?: () => void;
  onOpenFile?: () => void;
  onOpenRecentFile?: (path: string) => void;
  onOpenRecentWorkspace?: (path: string) => void;
}

const TIPS = [
  "Press Ctrl+P to quickly open any file.",
  "Use Ctrl+Shift+F to search across all files.",
  "Right-click files in the Explorer for more actions.",
  "Press F11 to toggle fullscreen mode.",
  "Use Ctrl+Shift+K to enter distraction-free Zen Mode.",
  "Split the editor with the ⊟ button in the tab bar.",
  "The Agent panel (Ctrl+Shift+A) helps you with AI-powered tasks.",
  "Press Ctrl+, to open Settings.",
];

export function WelcomeScreen({
  recentFiles,
  recentWorkspaces = [],
  onOpenQuickOpen,
  onOpenMarketplace,
  onNewFile,
  onOpenFolder,
  onOpenFile,
  onOpenRecentFile,
  onOpenRecentWorkspace,
}: WelcomeScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);

  const nextTip = () => setTipIndex((i) => (i + 1) % TIPS.length);
  const prevTip = () => setTipIndex((i) => (i - 1 + TIPS.length) % TIPS.length);

  return (
    <div
      role="main"
      aria-label="Welcome screen"
      style={{
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        height: "100%", width: "100%",
        color: "var(--editor-foreground, #cccccc)",
        overflow: "auto",
        background: "var(--editor-background, linear-gradient(135deg, #1e1e1e 0%, #252526 100%))",
      }}
    >
      <div style={{
        maxWidth: 680,
        width: "100%",
        padding: "clamp(32px, 8vh, 80px) clamp(12px, 3vw, 24px)",
        boxSizing: "border-box",
        flexShrink: 0,
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #007acc, #4ec9b0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            ⬡
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--editor-foreground, #ffffff)", letterSpacing: "-0.5px" }}>
              WebAssemblyIde
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--descriptionForeground, #666666)" }}>
              Next-generation, AI-native IDE
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--panelHeader-foreground, var(--descriptionForeground, #999999))", margin: "0 0 12px", fontWeight: "normal" }}>
            Start
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { icon: "📄", label: "New File", desc: "Ctrl+N", onClick: onNewFile ?? onOpenQuickOpen },
              { icon: "📂", label: "Open Folder…", desc: "Project", onClick: onOpenFolder ?? onOpenQuickOpen },
              { icon: "📃", label: "Open File…", desc: "Ctrl+O", onClick: onOpenFile ?? onOpenQuickOpen },
              { icon: "⚡", label: "Quick Open", desc: "Ctrl+P", onClick: onOpenQuickOpen },
              { icon: "▣", label: "Browse Extensions", desc: "", onClick: onOpenMarketplace },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", background: "var(--panel-background, #2d2d2d)",
                  border: "1px solid var(--sideBar-border, #3c3c3c)", borderRadius: 6,
                  color: "var(--editor-foreground, #cccccc)", cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--focusBorder, #007acc)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--sideBar-border, #3c3c3c)"; }}
              >
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "var(--editor-foreground, #e8e8e8)" }}>{action.label}</div>
                  {action.desc && <div style={{ fontSize: 11, color: "var(--descriptionForeground, #666666)" }}>{action.desc}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--panelHeader-foreground, var(--descriptionForeground, #999999))", margin: "0 0 10px", fontWeight: "normal" }}>
            Recent
          </h2>
          {recentFiles.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentFiles.slice(0, 6).map((file) => {
                const name = file.split("/").pop() ?? file;
                const dir = file.split("/").slice(0, -1).join("/");
                return (
                  <button key={file} type="button" onClick={() => (onOpenRecentFile ? onOpenRecentFile(file) : onOpenQuickOpen())}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "transparent", border: "none", borderRadius: 4, color: "var(--editor-foreground, #cccccc)", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--list-hoverBackground, rgba(255,255,255,0.05))"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 13 }}>📄</span>
                    <span style={{ fontSize: 13, color: "var(--editor-foreground, #e8e8e8)" }}>{name}</span>
                    <span style={{ fontSize: 11, color: "var(--descriptionForeground, #666666)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "6px 10px", color: "var(--descriptionForeground, #666666)", fontSize: 12 }}>
              No recent files.
            </div>
          )}
        </div>

        {/* Recent Workspaces */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", color: "#999999", margin: "0 0 10px", fontWeight: "normal" }}>
            Recent Workspaces
          </h2>
          {recentWorkspaces.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentWorkspaces.slice(0, 6).map((ws) => (
                <button
                  key={ws.path}
                  type="button"
                  onClick={() => onOpenRecentWorkspace?.(ws.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px", background: "transparent",
                    border: "none", borderRadius: 4, color: "#cccccc",
                    cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13 }}>📂</span>
                  <span style={{ fontSize: 13, color: "#e8e8e8" }}>{ws.name}</span>
                  <span style={{ fontSize: 11, color: "#666666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.path}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: "6px 10px", color: "#666666", fontSize: 12 }}>
              No recent workspaces. Open a folder to get started.
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", color: "#999999", margin: "0 0 10px", fontWeight: "normal" }}>
            Learn
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { icon: "📘", label: "Documentation", desc: "Read the docs" },
              { icon: "⌨", label: "Keyboard Shortcuts", desc: "Ctrl+K Ctrl+S" },
              { icon: "🤖", label: "Agent Guide", desc: "AI-powered tasks" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "10px 12px", background: "#252526", border: "1px solid #333333", borderRadius: 6, cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#454545"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#333333"; }}
              >
                <div style={{ fontSize: 16, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 12, color: "#e8e8e8", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#666666" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips carousel */}
        <div style={{ background: "#252526", border: "1px solid #333333", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ flex: 1, fontSize: 12, color: "#cccccc" }}>{TIPS[tipIndex]}</span>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button type="button" onClick={prevTip} style={{ background: "transparent", border: "none", color: "#666666", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>‹</button>
            <span style={{ fontSize: 11, color: "#666666", alignSelf: "center" }}>{tipIndex + 1}/{TIPS.length}</span>
            <button type="button" onClick={nextTip} style={{ background: "transparent", border: "none", color: "#666666", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
