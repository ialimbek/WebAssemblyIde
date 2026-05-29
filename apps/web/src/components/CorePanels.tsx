/**
 * CorePanels — rich UI implementations for Problems, Output, Debug,
 * SourceControl, and Settings panels.
 */

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useIDE } from "../ide-context.js";
import { KeybindingManager } from "@webassembly-ide/ide-core";
import type { TokenColorRule } from "@webassembly-ide/ide-core";
import type { GitFileStatus } from "../services/GitService.js";

/* ─── Problems Panel ─────────────────────────────────────────────────────── */

export interface DiagnosticItem {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning" | "info" | "hint";
  message: string;
  source?: string;
}

const SEVERITY_COLORS = {
  error: "#f44747",
  warning: "#e8a838",
  info: "#007acc",
  hint: "#4ec9b0",
};

const SEVERITY_ICONS = {
  error: "✕",
  warning: "⚠",
  info: "ℹ",
  hint: "💡",
};

export function ProblemsPanel() {
  const { editor } = useIDE();
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">(
    "all",
  );
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);

  useEffect(() => {
    const refreshDiagnostics = () => {
      const items: DiagnosticItem[] = [];
      const tabs = editor.getTabs();
      for (const tab of tabs) {
        const markers = editor.models.getMarkers(tab.uri);
        for (const marker of markers) {
          items.push({
            id: `${tab.uri}:${marker.range.start.line}:${marker.range.start.column}:${marker.message}`,
            file: tab.uri,
            line: marker.range.start.line,
            column: marker.range.start.column,
            severity: marker.severity === "error" ? "error" : marker.severity === "warning" ? "warning" : "info",
            message: marker.message,
            source: marker.source ?? tab.title,
          });
        }
      }
      setDiagnostics(items);
    };

    refreshDiagnostics();
    const disposables: Array<{ dispose: () => void }> = [];
    const tabs = editor.getTabs();
    for (const tab of tabs) {
      disposables.push(editor.models.onMarkersChanged(tab.uri, () => {
        refreshDiagnostics();
      }));
    }
    const tabDisposable = editor.onTabsChanged(() => {
      refreshDiagnostics();
    });
    disposables.push(tabDisposable);

    return () => {
      for (const d of disposables) d.dispose();
    };
  }, [editor]);

  const filtered =
    filter === "all"
      ? diagnostics
      : diagnostics.filter((d) => d.severity === filter);

  const counts = {
    error: diagnostics.filter((d) => d.severity === "error").length,
    warning: diagnostics.filter((d) => d.severity === "warning").length,
    info: diagnostics.filter((d) => d.severity === "info").length,
  };

  return (
    <section
      aria-label="Problems"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--editor-foreground, #cccccc)",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "var(--panelHeader-background, transparent)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--panelHeader-foreground, var(--descriptionForeground, #999999))",
            marginRight: 4,
          }}
        >
          Problems
        </span>
        {(["all", "error", "warning", "info"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: "2px 8px",
              border: "none",
              borderRadius: 3,
              fontSize: 11,
              cursor: "pointer",
              background: filter === s ? "var(--list-activeSelectionBackground, #094771)" : "transparent",
              color:
                s === "all"
                  ? "var(--editor-foreground, #cccccc)"
                  : (SEVERITY_COLORS[s as keyof typeof SEVERITY_COLORS] ??
                    "var(--editor-foreground, #cccccc)"),
            }}
          >
            {s === "all"
              ? `All (${diagnostics.length})`
              : `${SEVERITY_ICONS[s as keyof typeof SEVERITY_ICONS]} ${s} (${counts[s as keyof typeof counts]})`}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: "var(--descriptionForeground, #666666)", fontSize: 12 }}>
            No problems found.
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                gap: 8,
                padding: "6px 12px",
                borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))",
                cursor: "pointer",
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--list-hoverBackground, rgba(255,255,255,0.05))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <span
                style={{
                  color: SEVERITY_COLORS[d.severity],
                  fontSize: 13,
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                {SEVERITY_ICONS[d.severity]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, wordBreak: "break-word" }}>
                  {d.message}
                </div>
                <div style={{ fontSize: 11, color: "var(--descriptionForeground, #666666)", marginTop: 2 }}>
                  {d.file}:{d.line}:{d.column}
                  {d.source ? ` [${d.source}]` : ""}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ─── Output Panel ───────────────────────────────────────────────────────── */

export function OutputPanel() {
  const { terminal, git } = useIDE();
  const [channel, setChannel] = useState("Terminal");
  const [logs, setLogs] = useState<Record<string, string[]>>({
    Terminal: [],
    Build: [],
    Lint: [],
    Test: [],
    Git: [],
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const disposable = terminal.onOutput((chunk) => {
      setLogs((prev) => {
        const lines = chunk.data.split("\n").filter((l: string) => l.length > 0);
        const existing = prev["Terminal"] ?? [];
        return { ...prev, Terminal: [...existing, ...lines].slice(-500) };
      });
    });

    // Listen to git output - git service doesn't have onOutput, we'll track changes differently
    const gitDisposable = git.onChanged(() => {
      // Refresh git status/logs when git state changes
      void git.getStatus().then((status) => {
        setLogs((prev) => {
          const lines = [`Git status updated: ${status.length} files`];
          const existing = prev["Git"] ?? [];
          return { ...prev, Git: [...existing, ...lines].slice(-500) };
        });
      }).catch(() => {
        // Ignore errors when getting git status for logging
      });
    });

    return () => {
      disposable.dispose();
      gitDisposable.dispose();
    };
  }, [terminal, git]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channel, logs]);

  const clearChannel = () => {
    setLogs((prev) => ({ ...prev, [channel]: [] }));
  };

  return (
    <section
      aria-label="Output"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--editor-foreground, #cccccc)",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))",
          display: "flex",
          gap: 8,
          alignItems: "center",
          backgroundColor: "var(--panelHeader-background, transparent)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--panelHeader-foreground, var(--descriptionForeground, #999999))",
          }}
        >
          Output
        </span>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          style={{
            background: "var(--input-background, #3c3c3c)",
            border: "1px solid var(--input-border, #555555)",
            color: "var(--input-foreground, #cccccc)",
            fontSize: 12,
            padding: "2px 6px",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          {Object.keys(logs).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearChannel}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: "var(--icon-foreground, #969696)",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          Clear
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 12px",
          fontFamily: "'Cascadia Code', Consolas, monospace",
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {(logs[channel] ?? []).map((line, i) => (
          <div
            key={i}
            style={{
              color:
                line.includes("error") || line.includes("Error")
                  ? "#f44747"
                  : line.includes("warn") || line.includes("Warning")
                    ? "#e8a838"
                    : line.includes("fatal")
                      ? "#c74e39"
                        : line.includes("success") || line.includes("Success")
                          ? "#73c991"
                          : "var(--editor-foreground, #cccccc)",
            }}
          >
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}

/* ─── Debug Panel ────────────────────────────────────────────────────────── */

type DebugSessionState = "stopped" | "paused" | "running";

export function DebugPanel() {
  const [sessionState] = useState<DebugSessionState>("stopped");
  const [breakpoints, setBreakpoints] = useState<Array<{ id: string; file: string; line: number; enabled: boolean }>>([]);
  const [tab, setTab] = useState<
    "variables" | "watch" | "callStack" | "breakpoints"
  >("breakpoints");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight);
  }, [consoleOutput]);

  const executeConsoleExpression = () => {
    if (!consoleInput.trim()) return;
    const expr = consoleInput.trim();
    setConsoleOutput((prev) => [...prev, `> ${expr}`]);
    try {
      const result = new Function(`return (${expr})`)();
      setConsoleOutput((prev) => [...prev, String(result)]);
    } catch (e) {
      try {
        new Function(expr)();
        setConsoleOutput((prev) => [...prev, "undefined"]);
      } catch (err) {
        setConsoleOutput((prev) => [...prev, `Error: ${String(err)}`]);
      }
    }
    setConsoleInput("");
  };

  return (
    <section
      aria-label="Debug"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--editor-foreground, #cccccc)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))",
          display: "flex",
          alignItems: "center",
          gap: 4,
          backgroundColor: "var(--panelHeader-background, transparent)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--panelHeader-foreground, var(--descriptionForeground, #999999))",
            marginRight: 8,
          }}
        >
          Debug
        </span>
        {[
          {
            icon: "▶",
            title: "Start Debugging (F5)",
            disabled: sessionState === "running",
          },
          { icon: "⏸", title: "Pause", disabled: sessionState !== "running" },
          {
            icon: "▷",
            title: "Step Over (F10)",
            disabled: sessionState !== "paused",
          },
          {
            icon: "↘",
            title: "Step Into (F11)",
            disabled: sessionState !== "paused",
          },
          {
            icon: "↗",
            title: "Step Out (Shift+F11)",
            disabled: sessionState !== "paused",
          },
          {
            icon: "↺",
            title: "Restart (Ctrl+Shift+F5)",
            disabled: sessionState === "stopped",
          },
          {
            icon: "■",
            title: "Stop (Shift+F5)",
            disabled: sessionState === "stopped",
          },
        ].map((btn) => (
          <button
            key={btn.title}
            type="button"
            title={btn.title}
            disabled={btn.disabled}
            style={{
              background: "transparent",
              border: "none",
              color: btn.disabled ? "var(--disabledForeground, #555555)" : "var(--editor-foreground, #cccccc)",
              cursor: btn.disabled ? "default" : "pointer",
              fontSize: 14,
              padding: "2px 4px",
            }}
          >
            {btn.icon}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--descriptionForeground, #666666)" }}>
          {sessionState === "stopped"
            ? "No active debug session"
            : sessionState === "paused"
              ? "Paused at breakpoint"
              : "Running…"}
        </span>
      </div>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))" }}>
        {(["variables", "watch", "callStack", "breakpoints"] as const).map(
          (t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "4px 10px",
                border: "none",
                borderBottom:
                  tab === t ? "2px solid var(--focusBorder, #007acc)" : "2px solid transparent",
                background: "transparent",
                color: tab === t ? "var(--tab-activeForeground, #ffffff)" : "var(--tab-inactiveForeground, #969696)",
                cursor: "pointer",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {t === "callStack"
                ? "Call Stack"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ),
        )}
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 8, display: "flex", flexDirection: "column" }}>
        {tab === "breakpoints" && (
          <div>
            {breakpoints.length === 0 ? (
              <div style={{ color: "#666666", fontSize: 12, padding: 8 }}>
                No breakpoints set. Click in the editor gutter to add breakpoints.
              </div>
            ) : (
              breakpoints.map((bp) => (
                <div
                  key={bp.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 4px",
                    borderRadius: 3,
                  }}
                >
                  <span
                    style={{
                      color: bp.enabled ? "#f44747" : "#666666",
                      fontSize: 12,
                    }}
                  >
                    ●
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bp.file}:{bp.line}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBreakpoints((prev) => prev.filter((b) => b.id !== bp.id))}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#666666",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "variables" && (
          <div style={{ color: "#666666", fontSize: 12, padding: 8 }}>
            No active debug session. Start debugging to inspect variables.
          </div>
        )}
        {tab === "watch" && (
          <div style={{ color: "#666666", fontSize: 12, padding: 8 }}>
            No watch expressions. Add expressions to evaluate them at
            breakpoints.
          </div>
        )}
        {tab === "callStack" && (
          <div style={{ color: "#666666", fontSize: 12, padding: 8 }}>
            No active call stack. Pause execution to inspect the call stack.
          </div>
        )}
      </div>
      {/* Debug Console Input */}
      <div style={{ borderTop: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))", padding: "4px 8px", display: "flex", flexDirection: "column", maxHeight: 200 }}>
        <div ref={consoleRef} style={{ flex: 1, overflow: "auto", fontFamily: "'Cascadia Code', Consolas, monospace", fontSize: 12, lineHeight: 1.5, color: "var(--editor-foreground, #cccccc)", whiteSpace: "pre-wrap", marginBottom: 4, maxHeight: 120 }}>
          {consoleOutput.map((line, i) => (
            <div key={i} style={{ color: line.startsWith(">") ? "#569cd6" : line.startsWith("Error:") ? "#f44747" : "var(--editor-foreground, #cccccc)" }}>
              {line}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#569cd6", fontFamily: "monospace", fontSize: 12 }}>{">"}</span>
          <input
            type="text"
            value={consoleInput}
            onChange={(e) => setConsoleInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") executeConsoleExpression(); }}
            placeholder="Evaluate expression..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--editor-foreground, #cccccc)", fontFamily: "'Cascadia Code', Consolas, monospace", fontSize: 12 }}
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Source Control Panel ───────────────────────────────────────────────── */

const STATUS_LABEL: Record<string, string> = {
  new: "U",
  modified: "M",
  deleted: "D",
  staged: "A",
  "staged-modified": "M",
  "staged-deleted": "D",
  unmodified: " ",
  absent: "?",
  ignored: "!",
};
const STATUS_COLOR: Record<string, string> = {
  new: "#73c991",
  modified: "#e2c08d",
  deleted: "#c74e39",
  staged: "#73c991",
  "staged-modified": "#e2c08d",
  "staged-deleted": "#c74e39",
};
const STATUS_BG: Record<string, string> = {
  new: "rgba(115,201,145,0.12)",
  modified: "rgba(226,192,141,0.12)",
  deleted: "rgba(199,78,57,0.12)",
  staged: "rgba(115,201,145,0.12)",
  "staged-modified": "rgba(226,192,141,0.12)",
  "staged-deleted": "rgba(199,78,57,0.12)",
};


const diffCache = new Map<string, { original: string; modified: string }>();
export function getDiffData(uri: string) { return diffCache.get(uri); }
export function setDiffData(uri: string, data: { original: string; modified: string }) { diffCache.set(uri, data); }

interface GitCommit {
  oid: string;
  message: string;
  author: string;
  timestamp: number;
}

function splitFilePath(filepath: string): { dir: string; name: string } {
  const normalized = filepath.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash === -1) return { dir: "", name: normalized };
  return { dir: normalized.slice(0, lastSlash), name: normalized.slice(lastSlash + 1) };
}

function groupByDirectory(files: GitFileStatus[]): Map<string, GitFileStatus[]> {
  const groups = new Map<string, GitFileStatus[]>();
  for (const f of files) {
    const { dir } = splitFilePath(f.filepath);
    const key = dir || "(root)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  return groups;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function SourceControlPanel() {
  const { git, editor, workspace } = useIDE();
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [branch, setBranch] = useState("main");
  const [branches, setBranches] = useState<string[]>(["main"]);
  const [commitMsg, setCommitMsg] = useState("");
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [lastCommitSha, setLastCommitSha] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"changes" | "review">("changes");
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await git.init();
      const [status, b, brs, log] = await Promise.all([
        git.getStatus(),
        git.currentBranch(),
        git.getBranches(),
        git.getLog(30),
      ]);
      setFiles(status);
      setBranch(b);
      setBranches(brs.map((br) => br.name));
      setCommits(log);
    } finally {
      setLoading(false);
    }
  }, [git]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const d = git.onChanged(() => {
      void refresh();
    });
    return () => d.dispose();
  }, [git, refresh]);

  const staged = files.filter((f) => f.staged);
  const unstaged = files.filter((f) => !f.staged && f.status !== "unmodified");
  const totalChanges = staged.length + unstaged.length;

  const toggleDir = (dir: string) => {
    setCollapsedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  };

  const handleCommit = async () => {
    if (!commitMsg.trim() || staged.length === 0) return;
    try {
      const sha = await git.commit(commitMsg);
      setLastCommitSha(sha.slice(0, 8));
      setCommitMsg("");
      setCommitError(null);
    } catch (e) {
      setCommitError(String(e));
    }
  };

  const handleStageAll = async () => {
    await git.stageAll();
    void refresh();
  };

  const handleUnstageAll = async () => {
    for (const f of staged) {
      await git.unstage(f.filepath);
    }
    void refresh();
  };

  const scSectionStyle: React.CSSProperties = {
    padding: "0",
  };

  const scHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#999",
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <section
      aria-label="Source Control"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--editor-foreground, #cccccc)",
        fontSize: 12,
      }}
    >
      {/* Branch bar */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--panelHeader-background, var(--editor-background, #1e1e1e))",
        }}
      >
        <button
          type="button"
          onClick={() => setShowBranchDialog(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "var(--input-background, #2a2d2e)",
            border: "1px solid var(--input-border, var(--sideBar-border, #3c3c3c))",
            borderRadius: 4,
            color: "var(--editor-foreground, #cccccc)",
            padding: "3px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <span style={{ color: "#73c991", fontSize: 13 }}>⑂</span>
          <span>{branch}</span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          title="Refresh"
          onClick={() => void refresh()}
          style={{ ...iconBtnStyle, fontSize: 14 }}
        >
          ⟳
        </button>
      </div>

      {/* Tabs: Changes / Review */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))",
          background: "var(--panelHeader-background, var(--editor-background, #1e1e1e))",
        }}
      >
        {(["changes", "review"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "7px 0",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--focusBorder, #007acc)" : "2px solid transparent",
              color: activeTab === tab ? "var(--tab-activeForeground, #ffffff)" : "var(--tab-inactiveForeground, #888888)",
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            {tab === "changes" ? `Changes${totalChanges > 0 ? ` (${totalChanges})` : ""}` : "Review"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "changes" && (
          <>
            {/* Commit message */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))" }}>
              <textarea
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === "Enter") {
                    e.preventDefault();
                    void handleCommit();
                  }
                }}
                placeholder="Commit message (Ctrl+Enter)"
                rows={2}
                style={{
                  width: "100%",
                  background: "var(--input-background, #2a2d2e)",
                  border: "1px solid var(--input-border, var(--sideBar-border, #3c3c3c))",
                  color: "var(--input-foreground, #cccccc)",
                  borderRadius: 4,
                  padding: "6px 8px",
                  fontSize: 12,
                  resize: "none",
                  boxSizing: "border-box",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                disabled={!commitMsg.trim() || staged.length === 0}
                onClick={() => void handleCommit()}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "5px 0",
                  background: staged.length > 0 && commitMsg.trim() ? "var(--button-background, #0e639c)" : "var(--input-background, #2a2d2e)",
                  border: "none",
                  color: staged.length > 0 && commitMsg.trim() ? "var(--button-foreground, #fff)" : "var(--disabledForeground, #666)",
                  borderRadius: 4,
                  cursor: staged.length > 0 && commitMsg.trim() ? "pointer" : "default",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {loading ? "Committing..." : `Commit${staged.length > 0 ? ` (${staged.length})` : ""}`}
              </button>
            </div>

            {/* Feedback */}
            {commitError && (
              <div style={{ padding: "4px 12px", fontSize: 11, color: "#c74e39", background: "rgba(199,78,57,0.08)" }}>
                {commitError}
              </div>
            )}
            {lastCommitSha && !commitError && (
              <div style={{ padding: "4px 12px", fontSize: 11, color: "#73c991", background: "rgba(115,201,145,0.08)" }}>
                Committed {lastCommitSha}
              </div>
            )}

            {/* Staged changes */}
            {staged.length > 0 && (
              <div style={scSectionStyle}>
                <div style={scHeaderStyle}>
                  <span>Staged Changes ({staged.length})</span>
                  <button
                    type="button"
                    title="Unstage all"
                    onClick={() => void handleUnstageAll()}
                    style={{ ...iconBtnStyle, fontSize: 11 }}
                  >
                    −
                  </button>
                </div>
                {Array.from(groupByDirectory(staged)).map(([dir, dirFiles]) => {
                  const isCollapsed = collapsedDirs.has(`staged:${dir}`);
                  return (
                    <div key={dir}>
                      <div
                        onClick={() => toggleDir(`staged:${dir}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 12px 3px 16px",
                          fontSize: 12,
                          color: "#999",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <span style={{ fontSize: 10 }}>{isCollapsed ? "▶" : "▼"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
                      </div>
                      {!isCollapsed && dirFiles.map((f) => {
                        const { name } = splitFilePath(f.filepath);
                        return (
                          <GitFileRow
                            key={f.filepath}
                            name={name}
                            filepath={f.filepath}
                            status={f.status}
                            actionLabel="Unstage"
                            actionSymbol="−"
                            onAction={() => void git.unstage(f.filepath).then(() => void refresh()).catch(console.error)}
                            onShowDiff={async () => { const n = f.filepath.split('/').pop() || f.filepath; try { const [r, head] = await Promise.all([workspace.readFile(f.filepath), git.getHeadBlob(f.filepath)]); const tabTitle = `${n} (Working Tree)`; editor.openFile(f.filepath, r.content, { asPreview: false, title: tabTitle }); setDiffData(f.filepath, { original: head ?? "", modified: r.content }); const diffUri = `diff:${f.filepath}`; editor.openFile(diffUri, "", { asPreview: false, title: `${n} (Diff)` }); } catch(e) { console.error(e); } }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unstaged changes */}
            {unstaged.length > 0 && (
              <div style={scSectionStyle}>
                <div style={scHeaderStyle}>
                  <span>Changes ({unstaged.length})</span>
                  <button
                    type="button"
                    title="Stage all"
                    onClick={() => void handleStageAll()}
                    style={{ ...iconBtnStyle, fontSize: 11 }}
                  >
                    +
                  </button>
                </div>
                {Array.from(groupByDirectory(unstaged)).map(([dir, dirFiles]) => {
                  const isCollapsed = collapsedDirs.has(`unstaged:${dir}`);
                  return (
                    <div key={dir}>
                      <div
                        onClick={() => toggleDir(`unstaged:${dir}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 12px 3px 16px",
                          fontSize: 12,
                          color: "#999",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <span style={{ fontSize: 10 }}>{isCollapsed ? "▶" : "▼"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
                      </div>
                      {!isCollapsed && dirFiles.map((f) => {
                        const { name } = splitFilePath(f.filepath);
                        return (
                          <GitFileRow
                            key={f.filepath}
                            name={name}
                            filepath={f.filepath}
                            status={f.status}
                            actionLabel="Stage"
                            actionSymbol="+"
                            onAction={() => void git.stage(f.filepath).then(() => void refresh()).catch(console.error)}
                            onShowDiff={async () => { const n = f.filepath.split('/').pop() || f.filepath; try { const [r, head] = await Promise.all([workspace.readFile(f.filepath), git.getHeadBlob(f.filepath)]); const tabTitle = `${n} (Working Tree)`; editor.openFile(f.filepath, r.content, { asPreview: false, title: tabTitle }); setDiffData(f.filepath, { original: head ?? "", modified: r.content }); const diffUri = `diff:${f.filepath}`; editor.openFile(diffUri, "", { asPreview: false, title: `${n} (Diff)` }); } catch(e) { console.error(e); } }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {totalChanges === 0 && !loading && (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "#555" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 12 }}>Working tree is clean</div>
              </div>
            )}
          </>
        )}

        {activeTab === "review" && (
          <div>
            {commits.length === 0 && !loading && (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "#555" }}>
                <div style={{ fontSize: 12 }}>No commits yet</div>
              </div>
            )}
            {commits.map((c) => (
              <div
                key={c.oid}
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #2d2d2d",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "#e2c08d", fontSize: 11, fontFamily: "monospace", flexShrink: 0, marginTop: 1 }}>
                    {c.oid.slice(0, 7)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      color: "#e0e0e0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {c.message.split("\n")[0]}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                      {c.author.replace(/ <.*>/, "")} · {timeAgo(c.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branch switcher dialog */}
      {showBranchDialog && (
        <div
          role="dialog"
          aria-label="Branch"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBranchDialog(false);
          }}
        >
          <div
            style={{
              background: "var(--panel-background, var(--editorWidget-background, #252526))",
              border: "1px solid var(--sideBar-border, #454545)",
              borderRadius: 8,
              padding: 20,
              minWidth: 320,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--editor-foreground, #e8e8e8)" }}>
              Switch Branch
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 12,
              }}
            >
              {branches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    void git.checkout(b).then(() => {
                      setBranch(b);
                      setShowBranchDialog(false);
                      void refresh();
                    }).catch((err) => {
                      setCommitError(`Checkout failed: ${String(err)}`);
                    });
                  }}
                  style={{
                    padding: "6px 10px",
                    background: b === branch ? "var(--list-activeSelectionBackground, #094771)" : "var(--input-background, #2d2d2d)",
                    border: "1px solid",
                    borderColor: b === branch ? "var(--focusBorder, #007acc)" : "var(--sideBar-border, #454545)",
                    borderRadius: 4,
                    color: "var(--editor-foreground, #cccccc)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  {b === branch ? "⑂ " : "  "}
                  {b}
                </button>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--panelSection-border, var(--sideBar-border, #333))", paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: "var(--descriptionForeground, #999)", margin: "0 0 6px" }}>
                New branch from current:
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="branch-name"
                  style={{
                    flex: 1,
                    background: "var(--input-background, #3c3c3c)",
                    border: "1px solid var(--input-border, #555)",
                    color: "var(--input-foreground, #ccc)",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 12,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  disabled={!newBranchName.trim()}
                  onClick={() => {
                    void git.createBranch(newBranchName).then(() => {
                      setBranches((prev) => [...prev, newBranchName]);
                      setNewBranchName("");
                      setShowBranchDialog(false);
                      void refresh();
                    }).catch((err) => {
                      setCommitError(`Branch creation failed: ${String(err)}`);
                    });
                  }}
                  style={{
                    padding: "4px 12px",
                    background: newBranchName.trim() ? "var(--button-background, #0e639c)" : "var(--input-background, #2d2d2d)",
                    border: "none",
                    borderRadius: 4,
                    color: "var(--button-foreground, #fff)",
                    cursor: newBranchName.trim() ? "pointer" : "default",
                    fontSize: 12,
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GitFileRow({
  name,
  filepath,
  status,
  actionLabel,
  actionSymbol,
  onAction,
  onShowDiff,
}: {
  name: string;
  filepath: string;
  status: string;
  actionLabel: string;
  actionSymbol: string;
  onAction: () => void;
  onShowDiff: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 12px 3px 32px",
        cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        onClick={onShowDiff}
        style={{
          fontSize: 12,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "#cccccc",
        }}
        title={filepath}
      >
        {name}
      </span>
      <span
        style={{
          color: STATUS_COLOR[status] ?? "#cccccc",
          background: STATUS_BG[status] ?? "transparent",
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
          minWidth: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 3,
          fontFamily: "monospace",
        }}
      >
        {STATUS_LABEL[status] ?? "?"}
      </span>
      <button
        type="button"
        title={actionLabel}
        onClick={onAction}
        style={{
          background: "transparent",
          border: "none",
          color: hovered ? "#ccc" : "#555",
          cursor: "pointer",
          fontSize: 13,
          padding: "0 3px",
          lineHeight: 1,
          opacity: hovered ? 1 : 0.5,
        }}
      >
        {actionSymbol}
      </button>
    </div>
  );
}

/* ─── Settings Panel ─────────────────────────────────────────────────────── */

type SettingsTab = "editor" | "theme" | "keybindings" | "terminal" | "json";

const WORKBENCH_COLOR_CONTROLS = [
  ["editor.background", "Editor Background"],
  ["editor.foreground", "Editor Foreground"],
  ["sideBar.background", "Sidebar Background"],
  ["panel.background", "Panel Background"],
  ["titleBar.activeBackground", "Title/Header Background"],
  ["statusBar.background", "Status Bar Background"],
  ["button.background", "Accent / Button"],
  ["list.activeSelectionBackground", "Selection Background"],
  ["sideBar.border", "Borders"],
] as const;

const TOKEN_COLOR_CONTROLS = [
  ["comment", "Comments"],
  ["keyword", "Keywords"],
  ["string", "Strings"],
  ["number", "Numbers"],
  ["function", "Functions"],
  ["variable", "Variables"],
  ["type", "Types / Classes"],
] as const;

export function SettingsPanel({ initialTab = "editor" }: { initialTab?: SettingsTab }) {
  const { editor, theme } = useIDE();
  const cfg = editor.getConfig();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [wordWrap, setWordWrapState] = useState(cfg.wordWrap !== "off");
  const [minimap, setMinimapState] = useState(cfg.minimap);
  const [lineNumbers, setLineNumbersState] = useState(
    cfg.lineNumbers !== "off",
  );
  const [renderWhitespace, setRenderWhitespaceState] = useState(
    cfg.renderWhitespace !== "none" && cfg.renderWhitespace !== "selection",
  );
  const [bracketPairColorization, setBracketPairColorizationState] =
    useState(true);
  const [indentGuides, setIndentGuidesState] = useState(true);
  const [breadcrumbs, setBreadcrumbsState] = useState(true);
  const [fontSize, setFontSizeState] = useState(cfg.fontSize);
  const [tabSize, setTabSizeState] = useState(cfg.tabSize);
  const [fontFamily, setFontFamilyState] = useState(cfg.fontFamily);
  const [activeTheme, setActiveThemeState] = useState(() => theme.getActiveTheme());
  const [themes, setThemes] = useState(() => theme.listThemes());
  const keybindingManager = useMemo(() => {
    const km = new KeybindingManager();
    km.registerDefaults();
    return km;
  }, []);
  const allKeybindings = keybindingManager.getAllKeybindings();

  useEffect(() => setTab(initialTab), [initialTab]);

  useEffect(() =>
    theme.onThemeChange((next) => {
      setActiveThemeState(next);
      setThemes(theme.listThemes());
    }),
  [theme]);

  const applyThemeCustomization = (next: {
    colors?: Record<string, string>;
    tokenColors?: TokenColorRule[];
  }) => {
    const updated = theme.updateThemeCustomization(activeTheme.id, next);
    setActiveThemeState(updated);
    setThemes(theme.listThemes());
    editor.updateConfig({ theme: updated.id });
  };

  const setWorkbenchColor = (key: string, value: string) => {
    const customization = theme.getCustomization(activeTheme.id);
    applyThemeCustomization({
      ...customization,
      colors: {
        ...(customization.colors ?? {}),
        [key]: value,
      },
    });
  };

  const setTokenColor = (scope: string, value: string) => {
    const customization = theme.getCustomization(activeTheme.id);
    const nextTokenColors = [...(customization.tokenColors ?? [])];
    const idx = nextTokenColors.findIndex((rule) => rule.scope === scope);
    const nextRule: TokenColorRule = {
      scope,
      settings: { foreground: value },
    };
    if (idx >= 0) nextTokenColors[idx] = nextRule;
    else nextTokenColors.push(nextRule);
    applyThemeCustomization({ ...customization, tokenColors: nextTokenColors });
  };

  const setWordWrap = (v: boolean) => {
    setWordWrapState(v);
    editor.updateConfig({ wordWrap: v ? "on" : "off" });
  };
  const setMinimap = (v: boolean) => {
    setMinimapState(v);
    editor.updateConfig({ minimap: v });
  };
  const setLineNumbers = (v: boolean) => {
    setLineNumbersState(v);
    editor.updateConfig({ lineNumbers: v ? "on" : "off" });
  };
  const setRenderWhitespace = (v: boolean) => {
    setRenderWhitespaceState(v);
    editor.updateConfig({ renderWhitespace: v ? "all" : "none" });
  };
  const setBracketPairColorization = (v: boolean) => {
    setBracketPairColorizationState(v);
  };
  const setIndentGuides = (v: boolean) => {
    setIndentGuidesState(v);
  };
  const setBreadcrumbs = (v: boolean) => {
    setBreadcrumbsState(v);
  };
  const setFontSize = (v: number) => {
    setFontSizeState(v);
    editor.updateConfig({ fontSize: v });
  };
  const setTabSize = (v: number) => {
    setTabSizeState(v);
    editor.updateConfig({ tabSize: v });
  };
  const setFontFamily = (v: string) => {
    setFontFamilyState(v);
    editor.updateConfig({ fontFamily: v });
  };
  const setActiveTheme = (id: string) => {
    theme.setActiveTheme(id);
    const next = theme.getActiveTheme();
    setActiveThemeState(next);
    editor.updateConfig({ theme: id });
  };

  const settingsJSON = JSON.stringify(
    {
      "editor.wordWrap": wordWrap ? "on" : "off",
      "editor.minimap.enabled": minimap,
      "editor.lineNumbers": lineNumbers ? "on" : "off",
      "editor.renderWhitespace": renderWhitespace ? "all" : "none",
      "editor.bracketPairColorization.enabled": bracketPairColorization,
      "editor.guides.indentation": indentGuides,
      "editor.breadcrumbs.enabled": breadcrumbs,
      "editor.fontSize": fontSize,
      "editor.tabSize": tabSize,
      "editor.fontFamily": fontFamily,
      "workbench.colorTheme": activeTheme.id,
      "workbench.colorCustomizations": theme.getCustomization(activeTheme.id).colors ?? {},
      "editor.tokenColorCustomizations": theme.getCustomization(activeTheme.id).tokenColors ?? [],
    },
    null,
    2,
  );

  return (
    <section
      aria-label="Settings"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--editor-foreground, #cccccc)",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))",
          display: "flex",
          gap: 4,
          backgroundColor: "var(--panelHeader-background, transparent)",
        }}
      >
        {(["editor", "theme", "keybindings", "terminal", "json"] as const).map(
          (t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "3px 8px",
                border: "none",
                borderBottom:
                  tab === t ? "2px solid var(--focusBorder, #007acc)" : "2px solid transparent",
                background: "transparent",
                color: tab === t ? "var(--tab-activeForeground, #ffffff)" : "var(--tab-inactiveForeground, #969696)",
                cursor: "pointer",
                fontSize: 11,
                textTransform: "capitalize",
              }}
            >
              {t === "json" ? "JSON" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ),
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
        {tab === "editor" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SettingsSection title="Editor Appearance">
              <SettingsToggle
                label="Word Wrap"
                value={wordWrap}
                onChange={setWordWrap}
                description="Toggle word wrap in the editor"
              />
              <SettingsToggle
                label="Minimap"
                value={minimap}
                onChange={setMinimap}
                description="Show the minimap overview ruler"
              />
              <SettingsToggle
                label="Line Numbers"
                value={lineNumbers}
                onChange={setLineNumbers}
                description="Show line numbers in the gutter"
              />
              <SettingsToggle
                label="Render Whitespace"
                value={renderWhitespace}
                onChange={setRenderWhitespace}
                description="Render whitespace characters"
              />
              <SettingsToggle
                label="Bracket Pair Colorization"
                value={bracketPairColorization}
                onChange={setBracketPairColorization}
                description="Colorize matching brackets"
              />
              <SettingsToggle
                label="Indent Guides"
                value={indentGuides}
                onChange={setIndentGuides}
                description="Show indentation guides"
              />
              <SettingsToggle
                label="Breadcrumbs"
                value={breadcrumbs}
                onChange={setBreadcrumbs}
                description="Show breadcrumb navigation"
              />
            </SettingsSection>
            <SettingsSection title="Editor Font">
              <SettingsNumber
                label="Font Size"
                value={fontSize}
                onChange={setFontSize}
                min={8}
                max={32}
              />
              <SettingsNumber
                label="Tab Size"
                value={tabSize}
                onChange={setTabSize}
                min={1}
                max={8}
              />
              <SettingsInput
                label="Font Family"
                value={fontFamily}
                onChange={setFontFamily}
              />
            </SettingsSection>
          </div>
        )}

        {tab === "theme" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SettingsSection title="Color Theme">
              <p style={{ fontSize: 12, color: "var(--descriptionForeground, #999999)", margin: 0 }}>
                Choose a theme. The same theme is applied to the full workbench and Monaco editor.
              </p>
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => setActiveTheme(themeOption.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    width: "100%",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    border: "1px solid",
                    borderColor: activeTheme.id === themeOption.id ? "var(--focusBorder, #007acc)" : "var(--sideBar-border, #454545)",
                    borderRadius: 6,
                    background: activeTheme.id === themeOption.id ? "var(--list-activeSelectionBackground, #094771)" : "var(--panel-background, #2d2d2d)",
                    color: "var(--editor-foreground, #cccccc)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <ThemeSwatch colors={themeOption.colors} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: activeTheme.id === themeOption.id ? 700 : 500 }}>
                      {themeOption.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--tab-inactiveForeground, #888888)" }}>
                      {themeOption.type} · {themeOption.id}
                    </div>
                  </div>
                  {activeTheme.id === themeOption.id && (
                    <span style={{ color: "#4ec9b0", fontWeight: 700 }}>✓</span>
                  )}
                </button>
              ))}
            </SettingsSection>

            <SettingsSection title="Workbench Colors">
              {WORKBENCH_COLOR_CONTROLS.map(([key, label]) => (
                <SettingsColor
                  key={key}
                  label={label}
                  value={activeTheme.colors[key] ?? "#000000"}
                  onChange={(value) => setWorkbenchColor(key, value)}
                />
              ))}
            </SettingsSection>

            <SettingsSection title="Code Token Colors">
              <div
                aria-label="Token color preview"
                style={{
                  background: activeTheme.colors["editor.background"],
                  border: "1px solid var(--sideBar-border, #454545)",
                  borderRadius: 6,
                  padding: 12,
                  fontFamily: "'Cascadia Code', Consolas, monospace",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "keyword") }}>function</span>{" "}
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "function") }}>renderTheme</span>
                <span style={{ color: activeTheme.colors["editor.foreground"] }}>(</span>
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "variable") }}>theme</span>
                <span style={{ color: activeTheme.colors["editor.foreground"] }}>) </span>
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "comment"), fontStyle: "italic" }}>// live preview</span>
                <br />
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "keyword") }}>const</span>{" "}
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "variable") }}>accent</span>{" "}
                <span style={{ color: activeTheme.colors["editor.foreground"] }}>= </span>
                <span style={{ color: getTokenColor(activeTheme.tokenColors, "string") }}>&quot;professional&quot;</span>
                <span style={{ color: activeTheme.colors["editor.foreground"] }}>;</span>
              </div>
              {TOKEN_COLOR_CONTROLS.map(([scope, label]) => (
                <SettingsColor
                  key={scope}
                  label={label}
                  value={getTokenColor(activeTheme.tokenColors, scope)}
                  onChange={(value) => setTokenColor(scope, value)}
                />
              ))}
            </SettingsSection>

            <button
              type="button"
              onClick={() => {
                const reset = theme.resetThemeCustomization(activeTheme.id);
                setActiveThemeState(reset);
                setThemes(theme.listThemes());
                editor.updateConfig({ theme: reset.id });
              }}
              style={{
                padding: "7px 10px",
                background: "transparent",
                border: "1px solid var(--sideBar-border, #454545)",
                color: "var(--editor-foreground, #cccccc)",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Reset current theme customizations
            </button>
          </div>
        )}

        {tab === "keybindings" && (
          <div>
            <p style={{ fontSize: 12, color: "var(--descriptionForeground, #999999)", margin: "0 0 12px" }}>
              Keyboard shortcuts
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {allKeybindings.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 8px",
                    background: "var(--input-background, #2d2d2d)",
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "var(--editor-foreground, #cccccc)", flex: 1 }}>
                    {rule.keybinding.command}
                  </span>
                  <code
                    style={{
                      background: "var(--dropdown-background, var(--input-background, #3c3c3c))",
                      padding: "1px 6px",
                      borderRadius: 3,
                      fontSize: 11,
                      color: "var(--focusBorder, #4ec9b0)",
                    }}
                  >
                    {rule.keybinding.key}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "terminal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SettingsSection title="Terminal">
              <SettingsInput
                label="Default Shell"
                value="PowerShell"
                onChange={() => {}}
              />
              <SettingsNumber
                label="Font Size"
                value={13}
                onChange={() => {}}
                min={8}
                max={32}
              />
              <SettingsInput
                label="Font Family"
                value="'Cascadia Code', Consolas, monospace"
                onChange={() => {}}
              />
              <SettingsToggle
                label="Copy on Selection"
                value={true}
                onChange={() => {}}
                description="Copy text when you select it in the terminal"
              />
              <SettingsNumber
                label="Scrollback Lines"
                value={1000}
                onChange={() => {}}
                min={100}
                max={50000}
              />
            </SettingsSection>
          </div>
        )}

        {tab === "json" && (
          <div>
            <p style={{ fontSize: 12, color: "var(--descriptionForeground, #999999)", margin: "0 0 8px" }}>
              Settings (JSON). Changes are applied in the GUI tabs.
            </p>
            <pre
              style={{
                background: "var(--editor-background, #1e1e1e)",
                border: "1px solid var(--sideBar-border, #333333)",
                borderRadius: 4,
                padding: 12,
                fontSize: 12,
                color: "var(--editor-foreground, #9cdcfe)",
                overflow: "auto",
                margin: 0,
                fontFamily: "Consolas, monospace",
              }}
            >
              {settingsJSON}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Settings helpers ───────────────────────────────────────────────────── */

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        style={{
          margin: "0 0 8px",
          fontSize: 12,
          color: "var(--panelHeader-foreground, var(--descriptionForeground, #999999))",
          fontWeight: "normal",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function SettingsToggle({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 8px",
        background: "var(--panel-background, var(--input-background, #2d2d2d))",
        borderRadius: 4,
      }}
    >
      <div>
        <label htmlFor={id} style={{ fontSize: 12, cursor: "pointer" }}>
          {label}
        </label>
        {description && (
          <div style={{ fontSize: 11, color: "var(--descriptionForeground, #666666)" }}>{description}</div>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: 14,
          height: 14,
          cursor: "pointer",
          accentColor: "var(--focusBorder, #007acc)",
        }}
      />
    </div>
  );
}

function SettingsNumber({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 8px",
        background: "var(--panel-background, var(--input-background, #2d2d2d))",
        borderRadius: 4,
      }}
    >
      <label style={{ fontSize: 12 }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        style={{
          width: 60,
          background: "var(--input-background, #3c3c3c)",
          border: "1px solid var(--input-border, #555555)",
          color: "var(--input-foreground, #cccccc)",
          borderRadius: 3,
          padding: "2px 6px",
          fontSize: 12,
        }}
      />
    </div>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "4px 8px",
        background: "var(--panel-background, var(--input-background, #2d2d2d))",
        borderRadius: 4,
      }}
    >
      <label style={{ fontSize: 12 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--input-background, #3c3c3c)",
          border: "1px solid var(--input-border, #555555)",
          color: "var(--input-foreground, #cccccc)",
          borderRadius: 3,
          padding: "4px 8px",
          fontSize: 12,
          outline: "none",
        }}
      />
    </div>
  );
}

function SettingsColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const apply = (next: string) => {
    setDraft(next);
    if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next);
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 88px",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        background: "var(--panel-background, #2d2d2d)",
        borderRadius: 4,
      }}
    >
      <label style={{ fontSize: 12 }}>{label}</label>
      <input
        aria-label={`${label} color picker`}
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(draft) ? draft : "#000000"}
        onChange={(e) => apply(e.target.value)}
        style={{ width: 28, height: 24, padding: 0, border: "none", background: "transparent" }}
      />
      <input
        aria-label={`${label} hex color`}
        value={draft}
        onChange={(e) => apply(e.target.value)}
        style={{
          width: 88,
          background: "var(--input-background, #3c3c3c)",
          border: "1px solid var(--input-border, #555555)",
          color: "var(--input-foreground, #cccccc)",
          borderRadius: 3,
          padding: "3px 5px",
          fontSize: 11,
          fontFamily: "Consolas, monospace",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function ThemeSwatch({ colors }: { colors: Record<string, string> }) {
  const swatches = [
    colors["editor.background"] ?? "#1e1e1e",
    colors["sideBar.background"] ?? "#252526",
    colors["button.background"] ?? "#007acc",
    colors["editor.foreground"] ?? "#cccccc",
  ];
  return (
    <span
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 12px)",
        gridTemplateRows: "repeat(2, 12px)",
        overflow: "hidden",
        border: "1px solid var(--sideBar-border, #454545)",
        borderRadius: 4,
      }}
    >
      {swatches.map((color, index) => (
        <span key={`${color}-${index}`} style={{ background: color }} />
      ))}
    </span>
  );
}

function getTokenColor(
  rules: TokenColorRule[] | undefined,
  scope: string,
): string {
  const rule = rules?.find((candidate) =>
    Array.isArray(candidate.scope)
      ? candidate.scope.includes(scope)
      : candidate.scope === scope,
  );
  return rule?.settings.foreground ?? "#cccccc";
}

/* ─── Shared style ───────────────────────────────────────────────────────── */

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--icon-foreground, #969696)",
  cursor: "pointer",
  fontSize: 14,
  padding: "2px 4px",
};
