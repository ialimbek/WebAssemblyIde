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
import { ThemeManager, KeybindingManager } from "@webassembly-ide/ide-core";
import type { GitFileStatus, GitRemote } from "../services/GitService.js";
import type { GitHubCredentials } from "../services/GitHubAuth.js";
import { InputDialog } from "./FileContextMenu.js";

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
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">(
    "all",
  );
  const [diagnostics] = useState<DiagnosticItem[]>([
    {
      id: "1",
      file: "/project/src/main.ts",
      line: 5,
      column: 3,
      severity: "error",
      message: "Cannot find module './app'",
      source: "TypeScript",
    },
    {
      id: "2",
      file: "/project/src/app.ts",
      line: 12,
      column: 1,
      severity: "warning",
      message: "Variable 'x' is declared but never used",
      source: "TypeScript",
    },
    {
      id: "3",
      file: "/project/README.md",
      line: 1,
      column: 1,
      severity: "info",
      message: "No spelling issues found",
      source: "Spell Checker",
    },
  ]);

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
        color: "#cccccc",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#999999",
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
              background: filter === s ? "#094771" : "transparent",
              color:
                s === "all"
                  ? "#cccccc"
                  : (SEVERITY_COLORS[s as keyof typeof SEVERITY_COLORS] ??
                    "#cccccc"),
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
          <div style={{ padding: 16, color: "#666666", fontSize: 12 }}>
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
                borderBottom: "1px solid #2d2d2d",
                cursor: "pointer",
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.05)";
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
                <div style={{ fontSize: 11, color: "#666666", marginTop: 2 }}>
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
  const [channel, setChannel] = useState("Build");
  const [logs] = useState<Record<string, string[]>>({
    Build: [
      "[12:00:01] Starting build...",
      "[12:00:02] Compiling TypeScript...",
      "[12:00:05] Build succeeded. 0 errors, 0 warnings.",
    ],
    Lint: ["[12:00:01] Running ESLint...", "[12:00:02] No lint errors found."],
    Test: ["[12:00:01] Running tests...", "[12:00:04] All 21 tests passed."],
    "Extension Host": ["[12:00:00] Extension host started."],
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channel, logs]);

  return (
    <section
      aria-label="Output"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#cccccc",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#999999",
          }}
        >
          Output
        </span>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          style={{
            background: "#3c3c3c",
            border: "1px solid #555555",
            color: "#cccccc",
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
          onClick={() => {}}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: "#969696",
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
                  : line.includes("warn")
                    ? "#e8a838"
                    : "#cccccc",
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
  const [breakpoints] = useState([
    { id: "1", file: "/project/src/main.ts", line: 5, enabled: true },
    { id: "2", file: "/project/src/app.ts", line: 12, enabled: false },
  ]);
  const [tab, setTab] = useState<
    "variables" | "watch" | "callStack" | "breakpoints"
  >("breakpoints");

  return (
    <section
      aria-label="Debug"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#cccccc",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#999999",
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
              color: btn.disabled ? "#555555" : "#cccccc",
              cursor: btn.disabled ? "default" : "pointer",
              fontSize: 14,
              padding: "2px 4px",
            }}
          >
            {btn.icon}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#666666" }}>
          {sessionState === "stopped"
            ? "No active debug session"
            : sessionState === "paused"
              ? "Paused at breakpoint"
              : "Running…"}
        </span>
      </div>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid #333333" }}>
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
                  tab === t ? "2px solid #007acc" : "2px solid transparent",
                background: "transparent",
                color: tab === t ? "#ffffff" : "#969696",
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
      <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
        {tab === "breakpoints" && (
          <div>
            {breakpoints.map((bp) => (
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
            ))}
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
  new: "#4ec9b0",
  modified: "#e8a838",
  deleted: "#f44747",
  staged: "#4ec9b0",
  "staged-modified": "#e8a838",
  "staged-deleted": "#f44747",
};

export function SourceControlPanel() {
  const { git, githubAuth } = useIDE();
  const [files, setFiles] = useState<GitFileStatus[]>([]);
  const [branch, setBranch] = useState("main");
  const [remotes, setRemotes] = useState<GitRemote[]>([]);
  const [account, setAccount] = useState<GitHubCredentials | null>(
    githubAuth.getCredentials(),
  );
  const [showGitHubSignIn, setShowGitHubSignIn] = useState(false);
  const [showRemoteDialog, setShowRemoteDialog] = useState(false);
  const [githubError, setGitHubError] = useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState<"push" | "pull" | "fetch" | null>(
    null,
  );
  const [remoteStatus, setRemoteStatus] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>(["main"]);
  const [commitMsg, setCommitMsg] = useState("");
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [lastCommitSha, setLastCommitSha] = useState<string | null>(null);
  const [diff, setDiff] = useState<{ file: string; content: string } | null>(
    null,
  );
  const [isRepo, setIsRepo] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const repo = await git.isRepo();
      setIsRepo(repo);
      if (!repo) {
        setFiles([]);
        setBranch("main");
        setBranches(["main"]);
        setRemotes([]);
        return;
      }
      const [status, b, brs, rs] = await Promise.all([
        git.getStatus(),
        git.currentBranch(),
        git.getBranches(),
        git.listRemotes(),
      ]);
      setFiles(status);
      setBranch(b);
      setBranches(brs.map((br) => br.name));
      setRemotes(rs);
    } finally {
      setLoading(false);
    }
  }, [git]);

  const handleInitRepo = useCallback(async () => {
    setLoading(true);
    try {
      await git.init();
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [git, refresh]);

  const handleGitHubSignIn = useCallback(async (token: string) => {
    setGitHubError(null);
    try {
      await githubAuth.signIn(token);
      setShowGitHubSignIn(false);
    } catch (err) {
      setGitHubError(err instanceof Error ? err.message : String(err));
    }
  }, [githubAuth]);

  const handleConfigureRemote = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setRemoteStatus(null);
    try {
      await git.addRemote("origin", trimmed);
      await refresh();
      setRemoteStatus(`Remote 'origin' set to ${trimmed}`);
    } catch (err) {
      setRemoteStatus(
        err instanceof Error ? `Failed: ${err.message}` : `Failed: ${err}`,
      );
    }
  }, [git, refresh]);

  const handlePush = useCallback(async () => {
    setRemoteBusy("push");
    setRemoteStatus(null);
    try {
      const result = await git.push();
      if (result.ok) {
        setRemoteStatus(`Pushed ${result.ref ?? branch} to origin`);
      } else {
        setRemoteStatus(result.error ?? "Push failed");
      }
    } finally {
      setRemoteBusy(null);
    }
  }, [git, branch]);

  const handlePull = useCallback(async () => {
    setRemoteBusy("pull");
    setRemoteStatus(null);
    try {
      const result = await git.pull();
      if (result.ok) {
        setRemoteStatus("Pulled latest from origin");
        await refresh();
      } else {
        setRemoteStatus(result.error ?? "Pull failed");
      }
    } finally {
      setRemoteBusy(null);
    }
  }, [git, refresh]);

  const handleFetch = useCallback(async () => {
    setRemoteBusy("fetch");
    setRemoteStatus(null);
    try {
      const result = await git.fetch();
      setRemoteStatus(result.ok ? "Fetched origin" : (result.error ?? "Fetch failed"));
    } finally {
      setRemoteBusy(null);
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
  useEffect(() => {
    const d = githubAuth.onChanged((creds) => setAccount(creds));
    return () => d.dispose();
  }, [githubAuth]);

  const staged = files.filter((f) => f.staged);
  const unstaged = files.filter((f) => !f.staged && f.status !== "unmodified");

  return (
    <section
      aria-label="Source Control"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#cccccc",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#999999",
            }}
          >
            Source Control
          </span>
          <span
            style={{
              fontSize: 11,
              background: "#094771",
              color: "#ffffff",
              borderRadius: 10,
              padding: "1px 6px",
            }}
          >
            {files.filter((f) => f.status !== "unmodified").length}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            title="Refresh"
            onClick={() => void refresh()}
            style={iconBtnStyle}
          >
            ⟳
          </button>
          <button
            type="button"
            title="Commit"
            onClick={() => setShowCommitDialog(true)}
            disabled={!isRepo}
            style={{ ...iconBtnStyle, opacity: isRepo ? 1 : 0.5 }}
          >
            ✓
          </button>
          <button type="button" title="More actions" style={iconBtnStyle}>
            ⋯
          </button>
        </div>
      </div>

      {!isRepo && !loading && (
        <div
          style={{
            padding: "16px 12px",
            borderBottom: "1px solid #333333",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 12, color: "#cccccc" }}>
            The active workspace is not a git repository.
          </span>
          <button
            type="button"
            onClick={() => void handleInitRepo()}
            style={{
              background: "#0e639c",
              border: "1px solid #1177bb",
              color: "#ffffff",
              borderRadius: 3,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Initialize Repository
          </button>
        </div>
      )}

      {/* Branch indicator */}
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 11, color: "#4ec9b0" }}>⑂</span>
        <span style={{ fontSize: 12 }}>{branch}</span>
        <button
          type="button"
          onClick={() => setShowBranchDialog(true)}
          style={{
            marginLeft: "auto",
            fontSize: 11,
            background: "#2d2d2d",
            border: "1px solid #454545",
            color: "#cccccc",
            borderRadius: 3,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          Branch...
        </button>
      </div>

      {/* GitHub account + remote */}
      {isRepo && (
        <div
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid #333333",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#999999", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.5px" }}>
              GitHub
            </span>
            {account ? (
              <>
                <span style={{ color: "#4ec9b0" }}>● @{account.username}</span>
                <button
                  type="button"
                  onClick={() => githubAuth.signOut()}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "1px solid #454545",
                    color: "#cccccc",
                    borderRadius: 3,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontSize: 11,
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setGitHubError(null); setShowGitHubSignIn(true); }}
                style={{
                  marginLeft: "auto",
                  background: "#0e639c",
                  border: "1px solid #1177bb",
                  color: "#ffffff",
                  borderRadius: 3,
                  padding: "2px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Sign in to GitHub
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#999999", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.5px" }}>
              Remote
            </span>
            <span style={{ color: remotes.length ? "#cccccc" : "#666666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
              {remotes.length ? `${remotes[0].remote}: ${remotes[0].url}` : "not configured"}
            </span>
            <button
              type="button"
              onClick={() => setShowRemoteDialog(true)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid #454545",
                color: "#cccccc",
                borderRadius: 3,
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              {remotes.length ? "Change" : "Configure"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              disabled={!remotes.length || !account || remoteBusy !== null}
              onClick={() => void handlePush()}
              style={{
                flex: 1,
                background: remotes.length && account ? "#0e639c" : "#2d2d2d",
                border: "none",
                color: "#ffffff",
                borderRadius: 4,
                padding: "4px 0",
                fontSize: 11,
                cursor: remotes.length && account ? "pointer" : "default",
                opacity: remoteBusy === "push" ? 0.6 : 1,
              }}
              title={!account ? "Sign in to GitHub first" : !remotes.length ? "Configure a remote first" : "Push current branch to origin"}
            >
              {remoteBusy === "push" ? "Pushing…" : "Push"}
            </button>
            <button
              type="button"
              disabled={!remotes.length || !account || remoteBusy !== null}
              onClick={() => void handlePull()}
              style={{
                flex: 1,
                background: "#2d2d2d",
                border: "1px solid #454545",
                color: "#cccccc",
                borderRadius: 4,
                padding: "4px 0",
                fontSize: 11,
                cursor: remotes.length && account ? "pointer" : "default",
                opacity: remoteBusy === "pull" ? 0.6 : 1,
              }}
              title="Pull (fast-forward only) from origin"
            >
              {remoteBusy === "pull" ? "Pulling…" : "Pull"}
            </button>
            <button
              type="button"
              disabled={!remotes.length || remoteBusy !== null}
              onClick={() => void handleFetch()}
              style={{
                flex: 1,
                background: "#2d2d2d",
                border: "1px solid #454545",
                color: "#cccccc",
                borderRadius: 4,
                padding: "4px 0",
                fontSize: 11,
                cursor: remotes.length ? "pointer" : "default",
                opacity: remoteBusy === "fetch" ? 0.6 : 1,
              }}
              title="Fetch origin"
            >
              {remoteBusy === "fetch" ? "Fetching…" : "Fetch"}
            </button>
          </div>

          {remoteStatus && (
            <div style={{ fontSize: 11, color: remoteStatus.startsWith("Failed") || remoteStatus.toLowerCase().includes("fail") ? "#f44747" : "#4ec9b0" }}>
              {remoteStatus}
            </div>
          )}
        </div>
      )}

      {/* Commit message input */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #333333" }}>
        <textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          rows={2}
          style={{
            width: "100%",
            background: "#3c3c3c",
            border: "1px solid #555555",
            color: "#cccccc",
            borderRadius: 4,
            padding: "6px 8px",
            fontSize: 12,
            resize: "none",
            boxSizing: "border-box",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button
            type="button"
            disabled={!commitMsg.trim() || staged.length === 0}
            onClick={async () => {
              try {
                const sha = await git.commit(commitMsg);
                setLastCommitSha(sha.slice(0, 8));
                setCommitMsg("");
                setShowCommitDialog(false);
                setCommitError(null);
              } catch (e) {
                setCommitError(String(e));
              }
            }}
            style={{
              flex: 1,
              padding: "5px 0",
              background:
                staged.length > 0 && commitMsg.trim() ? "#0e639c" : "#2d2d2d",
              border: "none",
              color: "#fff",
              borderRadius: 4,
              cursor:
                staged.length > 0 && commitMsg.trim() ? "pointer" : "default",
              fontSize: 12,
            }}
          >
            {loading ? "…" : `Commit (${staged.length})`}
          </button>
        </div>
      </div>

      {/* Commit error */}
      {commitError && (
        <div style={{ padding: "4px 12px", fontSize: 11, color: "#f44747" }}>
          {commitError}
        </div>
      )}
      {lastCommitSha && (
        <div style={{ padding: "4px 12px", fontSize: 11, color: "#4ec9b0" }}>
          ✓ Committed {lastCommitSha}
        </div>
      )}

      {/* Changes */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {files.length === 0 && !loading && (
          <div style={{ padding: 12, fontSize: 12, color: "#666666" }}>
            No changes. Working tree is clean.
          </div>
        )}
        {staged.length > 0 && (
          <GitChangeGroup
            title={`Staged Changes (${staged.length})`}
            files={staged}
            onAction={(f, action) => {
              if (action === "unstage")
                void git.unstage(f.filepath).then(() => void refresh());
            }}
            onShowDiff={(f) =>
              void git
                .getDiff(f.filepath)
                .then((d) => setDiff({ file: f.filepath, content: d }))
            }
          />
        )}
        {unstaged.length > 0 && (
          <GitChangeGroup
            title={`Changes (${unstaged.length})`}
            files={unstaged}
            onAction={(f, action) => {
              if (action === "stage")
                void git.stage(f.filepath).then(() => void refresh());
            }}
            onShowDiff={(f) =>
              void git
                .getDiff(f.filepath)
                .then((d) => setDiff({ file: f.filepath, content: d }))
            }
          />
        )}
      </div>

      {/* Diff viewer */}
      {diff && (
        <div
          style={{
            borderTop: "1px solid #333",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          <div
            style={{
              padding: "4px 12px",
              fontSize: 11,
              color: "#999",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Diff: {diff.file}</span>
            <button
              type="button"
              onClick={() => setDiff(null)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "0 12px 8px",
              fontSize: 11,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              color: "#cccccc",
            }}
          >
            {diff.content.split("\n").map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith("+")
                    ? "#4ec9b0"
                    : line.startsWith("-")
                      ? "#f44747"
                      : "#cccccc",
                }}
              >
                {line}
              </div>
            ))}
          </pre>
        </div>
      )}

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
              background: "#252526",
              border: "1px solid #454545",
              borderRadius: 8,
              padding: 20,
              minWidth: 320,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#e8e8e8" }}>
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
                    });
                  }}
                  style={{
                    padding: "6px 10px",
                    background: b === branch ? "#094771" : "#2d2d2d",
                    border: "1px solid",
                    borderColor: b === branch ? "#007acc" : "#454545",
                    borderRadius: 4,
                    color: "#cccccc",
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
            <div style={{ borderTop: "1px solid #333", paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: "#999", margin: "0 0 6px" }}>
                New branch from current:
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="branch-name"
                  style={{
                    flex: 1,
                    background: "#3c3c3c",
                    border: "1px solid #555",
                    color: "#ccc",
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
                    });
                  }}
                  style={{
                    padding: "4px 12px",
                    background: newBranchName.trim() ? "#0e639c" : "#2d2d2d",
                    border: "none",
                    borderRadius: 4,
                    color: "#fff",
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

      {/* Commit dialog overlay */}
      {showCommitDialog && (
        <div
          role="dialog"
          aria-label="Commit"
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
            if (e.target === e.currentTarget) setShowCommitDialog(false);
          }}
        >
          <div
            style={{
              background: "#252526",
              border: "1px solid #454545",
              borderRadius: 8,
              padding: 24,
              minWidth: 360,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Create Commit</h3>
            <textarea
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Commit message"
              rows={4}
              style={{
                width: "100%",
                background: "#3c3c3c",
                border: "1px solid #555555",
                color: "#cccccc",
                borderRadius: 4,
                padding: "6px 8px",
                fontSize: 13,
                boxSizing: "border-box",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
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
                onClick={() => setShowCommitDialog(false)}
                style={{
                  padding: "6px 16px",
                  background: "transparent",
                  border: "1px solid #555555",
                  borderRadius: 4,
                  color: "#cccccc",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const sha = await git.commit(commitMsg);
                    setLastCommitSha(sha.slice(0, 8));
                    setCommitMsg("");
                    setShowCommitDialog(false);
                    setCommitError(null);
                  } catch (e) {
                    setCommitError(String(e));
                  }
                }}
                style={{
                  padding: "6px 16px",
                  background: "#0e639c",
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub sign-in dialog */}
      {showGitHubSignIn && (
        <InputDialog
          title="Sign in to GitHub"
          placeholder="ghp_… (Personal Access Token)"
          confirmLabel="Sign in"
          onConfirm={(value) => void handleGitHubSignIn(value)}
          onClose={() => setShowGitHubSignIn(false)}
        />
      )}
      {githubError && showGitHubSignIn === false && (
        <div style={{ padding: "4px 12px", fontSize: 11, color: "#f44747" }}>
          {githubError}
        </div>
      )}

      {/* Remote configure dialog */}
      {showRemoteDialog && (
        <InputDialog
          title="Configure 'origin' remote"
          placeholder="https://github.com/owner/repo.git"
          defaultValue={remotes[0]?.url ?? (account ? `https://github.com/${account.username}/` : "https://github.com/")}
          confirmLabel="Save remote"
          onConfirm={(value) => { setShowRemoteDialog(false); void handleConfigureRemote(value); }}
          onClose={() => setShowRemoteDialog(false)}
        />
      )}
    </section>
  );
}

function GitChangeGroup({
  title,
  files,
  onAction,
  onShowDiff,
}: {
  title: string;
  files: GitFileStatus[];
  onAction: (f: GitFileStatus, action: "stage" | "unstage") => void;
  onShowDiff: (f: GitFileStatus) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          background: "transparent",
          border: "none",
          color: "#999999",
          cursor: "pointer",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          textAlign: "left",
        }}
      >
        <span>{collapsed ? "▶" : "▼"}</span>
        <span>{title}</span>
      </button>
      {!collapsed &&
        files.map((f) => (
          <div
            key={f.filepath}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 12px 2px 24px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span
              style={{
                fontSize: 12,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onClick={() => onShowDiff(f)}
            >
              {f.filepath}
            </span>
            <span
              style={{
                color: STATUS_COLOR[f.status] ?? "#cccccc",
                fontSize: 11,
                fontWeight: "bold",
                flexShrink: 0,
                minWidth: 14,
              }}
            >
              {STATUS_LABEL[f.status] ?? "?"}
            </span>
            <button
              type="button"
              title={f.staged ? "Unstage" : "Stage"}
              onClick={() => onAction(f, f.staged ? "unstage" : "stage")}
              style={{
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: 11,
                padding: "0 2px",
              }}
            >
              {f.staged ? "−" : "+"}
            </button>
          </div>
        ))}
    </div>
  );
}

/* ─── Settings Panel ─────────────────────────────────────────────────────── */

export function SettingsPanel() {
  const { editor } = useIDE();
  const cfg = editor.getConfig();
  const [tab, setTab] = useState<
    "editor" | "theme" | "keybindings" | "terminal" | "json"
  >("editor");
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
  const themeManager = useMemo(() => new ThemeManager(), []);
  const themes = themeManager.listThemes();
  const [activeTheme, setActiveThemeState] = useState(cfg.theme ?? "ide-dark");
  const keybindingManager = useMemo(() => {
    const km = new KeybindingManager();
    km.registerDefaults();
    return km;
  }, []);
  const allKeybindings = keybindingManager.getAllKeybindings();

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
    setActiveThemeState(id);
    editor.updateConfig({ theme: id });
    themeManager.setActiveTheme(id);
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
      "workbench.colorTheme": activeTheme,
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
        color: "#cccccc",
      }}
    >
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          gap: 4,
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
                  tab === t ? "2px solid #007acc" : "2px solid transparent",
                background: "transparent",
                color: tab === t ? "#ffffff" : "#969696",
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
          <div>
            <p style={{ fontSize: 12, color: "#999999", margin: "0 0 12px" }}>
              Select a color theme
            </p>
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setActiveTheme(theme.id);
                  themeManager.setActiveTheme(theme.id);
                }}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  marginBottom: 4,
                  border: "1px solid",
                  borderColor: activeTheme === theme.id ? "#007acc" : "#454545",
                  borderRadius: 4,
                  background: activeTheme === theme.id ? "#094771" : "#2d2d2d",
                  color: "#cccccc",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: theme.type === "dark" ? "#1e1e1e" : "#ffffff",
                    border: "2px solid #555555",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: activeTheme === theme.id ? "bold" : "normal",
                    }}
                  >
                    {theme.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#666666" }}>
                    {theme.type}
                  </div>
                </div>
                {activeTheme === theme.id && (
                  <span style={{ marginLeft: "auto", color: "#4ec9b0" }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {tab === "keybindings" && (
          <div>
            <p style={{ fontSize: 12, color: "#999999", margin: "0 0 12px" }}>
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
                    background: "#2d2d2d",
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#cccccc", flex: 1 }}>
                    {rule.keybinding.command}
                  </span>
                  <code
                    style={{
                      background: "#3c3c3c",
                      padding: "1px 6px",
                      borderRadius: 3,
                      fontSize: 11,
                      color: "#4ec9b0",
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
            <p style={{ fontSize: 12, color: "#999999", margin: "0 0 8px" }}>
              Settings (JSON). Changes are applied in the GUI tabs.
            </p>
            <pre
              style={{
                background: "#1e1e1e",
                border: "1px solid #333333",
                borderRadius: 4,
                padding: 12,
                fontSize: 12,
                color: "#9cdcfe",
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
          color: "#999999",
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
        background: "#2d2d2d",
        borderRadius: 4,
      }}
    >
      <div>
        <label htmlFor={id} style={{ fontSize: 12, cursor: "pointer" }}>
          {label}
        </label>
        {description && (
          <div style={{ fontSize: 11, color: "#666666" }}>{description}</div>
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
          accentColor: "#007acc",
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
        background: "#2d2d2d",
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
          background: "#3c3c3c",
          border: "1px solid #555555",
          color: "#cccccc",
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
        background: "#2d2d2d",
        borderRadius: 4,
      }}
    >
      <label style={{ fontSize: 12 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#3c3c3c",
          border: "1px solid #555555",
          color: "#cccccc",
          borderRadius: 3,
          padding: "4px 8px",
          fontSize: 12,
          outline: "none",
        }}
      />
    </div>
  );
}

/* ─── Shared style ───────────────────────────────────────────────────────── */

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#969696",
  cursor: "pointer",
  fontSize: 14,
  padding: "2px 4px",
};
