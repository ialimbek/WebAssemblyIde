/**
 * WelcomeScreen — rich welcome screen shown when no editor tab is open.
 * Shows recent files, quick actions, tips, and getting-started guide.
 */

import { useState } from "react";
import {
  File,
  FolderOpen,
  Zap,
  LayoutGrid,
  Book,
  Keyboard,
  Bot,
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from "lucide-react";

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
  "Split the editor with the split button in the tab bar.",
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
        clipPath: "inset(1px round 26px)",
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
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #007acc, #4ec9b0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0, 122, 204, 0.3)" }}>
            <LayoutGrid size={32} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "var(--editor-foreground, #ffffff)", letterSpacing: "-0.5px" }}>
              Codembly
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--descriptionForeground, #888888)", fontWeight: 500 }}>
              Next-generation, AI-native IDE
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", color: "var(--panelHeader-foreground, var(--descriptionForeground, #888888))", margin: "0 0 16px", fontWeight: 600 }}>
            Start
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: <File size={20} />, label: "New File", desc: "Ctrl+N", onClick: onNewFile ?? onOpenQuickOpen },
              { icon: <FolderOpen size={20} />, label: "Open Folder…", desc: "Project", onClick: onOpenFolder ?? onOpenQuickOpen },
              { icon: <File size={20} />, label: "Open File…", desc: "Ctrl+O", onClick: onOpenFile ?? onOpenQuickOpen },
              { icon: <Zap size={20} />, label: "Quick Open", desc: "Ctrl+P", onClick: onOpenQuickOpen },
              { icon: <LayoutGrid size={20} />, label: "Browse Extensions", desc: "", onClick: onOpenMarketplace },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", background: "var(--panel-background, #252526)",
                  border: "1px solid var(--sideBar-border, #3c3c3c)", borderRadius: 8,
                  color: "var(--editor-foreground, #e8e8e8)", cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--focusBorder, #007acc)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--sideBar-border, #3c3c3c)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", color: "var(--accent-blue, #4ec9b0)" }}>{action.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "var(--editor-foreground, #e8e8e8)", fontWeight: 500 }}>{action.label}</div>
                  {action.desc && <div style={{ fontSize: 11, color: "var(--descriptionForeground, #888888)", marginTop: 2 }}>{action.desc}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", color: "var(--panelHeader-foreground, var(--descriptionForeground, #888888))", margin: "0 0 16px", fontWeight: 600 }}>
            Recent
          </h2>
          {recentFiles.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentFiles.slice(0, 6).map((file) => {
                const name = file.split("/").pop() ?? file;
                const dir = file.split("/").slice(0, -1).join("/");
                return (
                  <button key={file} type="button" onClick={() => (onOpenRecentFile ? onOpenRecentFile(file) : onOpenQuickOpen())}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "transparent", border: "none", borderRadius: 6, color: "var(--editor-foreground, #e8e8e8)", cursor: "pointer", textAlign: "left", transition: "background 0.1s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--list-hoverBackground, rgba(255,255,255,0.06))"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <File size={16} style={{ color: "var(--accent-blue, #4ec9b0)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--editor-foreground, #e8e8e8)", fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: 11, color: "var(--descriptionForeground, #888888)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "12px", color: "var(--descriptionForeground, #888888)", fontSize: 12, background: "var(--panel-background, #252526)", borderRadius: 6 }}>
              No recent files.
            </div>
          )}
        </div>

        {/* Recent Workspaces */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", color: "var(--panelHeader-foreground, var(--descriptionForeground, #888888))", margin: "0 0 16px", fontWeight: 600 }}>
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
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", background: "transparent",
                    border: "none", borderRadius: 6, color: "var(--editor-foreground, #e8e8e8)",
                    cursor: "pointer", textAlign: "left", transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--list-hoverBackground, rgba(255,255,255,0.06))"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <FolderOpen size={16} style={{ color: "var(--accent-orange, #e2c08d)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--editor-foreground, #e8e8e8)", fontWeight: 500 }}>{ws.name}</span>
                  <span style={{ fontSize: 11, color: "var(--descriptionForeground, #888888)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.path}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: "12px", color: "var(--descriptionForeground, #888888)", fontSize: 12, background: "var(--panel-background, #252526)", borderRadius: 6 }}>
              No recent workspaces. Open a folder to get started.
            </div>
          )}
        </div>

        {/* Getting Started */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", color: "var(--panelHeader-foreground, var(--descriptionForeground, #888888))", margin: "0 0 16px", fontWeight: 600 }}>
            Learn
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { icon: <Book size={20} />, label: "Documentation", desc: "Read the docs" },
              { icon: <Keyboard size={20} />, label: "Keyboard Shortcuts", desc: "Ctrl+K Ctrl+S" },
              { icon: <Bot size={20} />, label: "Agent Guide", desc: "AI-powered tasks" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "16px", background: "var(--panel-background, #252526)", border: "1px solid var(--sideBar-border, #3c3c3c)", borderRadius: 8, cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--focusBorder, #007acc)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--sideBar-border, #3c3c3c)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, color: "var(--accent-purple, #bd93f9)" }}>{item.icon}</div>
                <div style={{ fontSize: 13, color: "var(--editor-foreground, #e8e8e8)", marginBottom: 4, fontWeight: 500, textAlign: "center" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--descriptionForeground, #888888)", textAlign: "center" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips carousel */}
        <div style={{ background: "linear-gradient(135deg, rgba(78, 201, 176, 0.1), rgba(0, 122, 204, 0.1))", border: "1px solid var(--sideBar-border, #3c3c3c)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <Lightbulb size={20} style={{ color: "var(--accent-yellow, #e8a838)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: "var(--editor-foreground, #e8e8e8)", lineHeight: 1.5 }}>{TIPS[tipIndex]}</span>
          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
            <button type="button" onClick={prevTip} style={{ background: "transparent", border: "none", color: "var(--descriptionForeground, #888888)", cursor: "pointer", padding: "4px", borderRadius: 4, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 11, color: "var(--descriptionForeground, #888888)", fontWeight: 500 }}>{tipIndex + 1}/{TIPS.length}</span>
            <button type="button" onClick={nextTip} style={{ background: "transparent", border: "none", color: "var(--descriptionForeground, #888888)", cursor: "pointer", padding: "4px", borderRadius: 4, transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
