/**
 * TerminalPanel — enhanced terminal UI with shell selector, split pane,
 * command history, environment variable management, and profile support.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIDE } from "../ide-context.js";
import type {
  TerminalSession,
  WorkspaceManager,
} from "@webassembly-ide/ide-core";
import { useWasmComponentRuntime } from "../hooks/useWasmComponentRuntime.js";

const SHELL_PROFILES = [
  { id: "powershell", label: "PowerShell", icon: "🔷", cmd: "pwsh.exe" },
  { id: "cmd", label: "Command Prompt", icon: "⬛", cmd: "cmd.exe" },
  { id: "bash", label: "Git Bash", icon: "🐚", cmd: "bash.exe" },
  { id: "wsl", label: "WSL (Ubuntu)", icon: "🐧", cmd: "wsl.exe" },
];

type SplitDirection = "horizontal" | "vertical" | null;

export function TerminalPanel() {
  const { terminal, commandPolicy, workspace, terminalConfig } = useIDE();
  const wasm = useWasmComponentRuntime();
  const initialTerminalConfig = terminalConfig.getConfig();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [splitDirection, setSplitDirection] = useState<SplitDirection>(null);
  const [showShellPicker, setShowShellPicker] = useState(false);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [terminalSettings, setTerminalSettings] = useState(initialTerminalConfig);
  const [selectedShell, setSelectedShell] = useState(
    SHELL_PROFILES.find((profile) => profile.id === initialTerminalConfig.defaultShell) ?? SHELL_PROFILES[0],
  );
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
    [
      { key: "NODE_ENV", value: "development" },
      { key: "PATH", value: "/usr/local/bin:/usr/bin:/bin" },
    ],
  );
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshSessions = useCallback(() => {
    const all = terminal.getSessions();
    setSessions([...all]);
    if (!activeSessionId && all.length > 0) {
      setActiveSessionId(all[0].id);
    }
  }, [terminal, activeSessionId]);

  useEffect(() => {
    refreshSessions();
    const disposable = terminal.onStatusChange(() => {
      refreshSessions();
    });
    return () => disposable.dispose();
  }, [terminal, refreshSessions]);

  useEffect(() => {
    const disposable = terminalConfig.onConfigChanged((next) => {
      setTerminalSettings(next);
      setSelectedShell(
        SHELL_PROFILES.find((profile) => profile.id === next.defaultShell) ?? SHELL_PROFILES[0],
      );
    });
    return () => disposable.dispose();
  }, [terminalConfig]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  const createSession = (shellId?: string) => {
    const shell = SHELL_PROFILES.find((s) => s.id === shellId) ?? selectedShell;
    terminal.createSession({ type: "user", label: shell.label, shell: shell.cmd });
    setShowShellPicker(false);
    refreshSessions();
  };

  const copySelection = () => {
    if (!terminalSettings.copyOnSelection || typeof navigator === "undefined") return;
    const selectedText = window.getSelection()?.toString();
    if (!selectedText?.trim()) return;
    void navigator.clipboard?.writeText(selectedText);
  };

  const closeSession = (id: string) => {
    terminal.closeSession(id);
    const remaining = sessions.filter((s) => s.id !== id);
    setActiveSessionId(
      remaining.length > 0 ? remaining[remaining.length - 1].id : null,
    );
    refreshSessions();
  };

  const executeCommand = () => {
    if (!activeSessionId || !input.trim()) return;

    const cmd = input.trim();
    const policy = commandPolicy.evaluate(cmd);

    if (!policy.allowed) {
      terminal.appendOutput(
        activeSessionId,
        `[BLOCKED] ${policy.reason}\n`,
        "stderr",
      );
      setInput("");
      return;
    }

    if (policy.requiresApproval) {
      terminal.appendOutput(
        activeSessionId,
        `[APPROVAL REQUIRED] ${policy.reason}: ${cmd}\n`,
        "stdout",
      );
    }

    setCommandHistory((prev) => [cmd, ...prev.slice(0, 99)]);
    setHistoryIndex(-1);
    terminal.appendOutput(activeSessionId, `$ ${cmd}\n`);
    terminal.setCurrentCommand(activeSessionId, cmd);
    terminal.setSessionStatus(activeSessionId, "running");
    const sessId = activeSessionId;
    void handleCommand(cmd, workspace).then((out: string) => {
      terminal.appendOutput(sessId, out);
      terminal.setCurrentCommand(sessId, undefined);
      terminal.setSessionStatus(sessId, "idle");
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (commandHistory[newIndex]) setInput(commandHistory[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? "" : (commandHistory[newIndex] ?? ""));
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  const terminalArea = (sessionId: string | null) => {
    const sess = sessionId ? terminal.getSession(sessionId) : null;
    const out = sessionId
      ? wasm.lastDelimitedLines(
        terminal.getOutput(sessionId),
        terminalSettings.scrollbackLines,
      )
      : [];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div
          ref={splitDirection ? undefined : outputRef}
          onMouseUp={copySelection}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "8px 12px",
            fontFamily: terminalSettings.fontFamily,
            fontSize: `${terminalSettings.fontSize}px`,
            lineHeight: "1.5",
            color: "var(--terminal-foreground, var(--editor-foreground, #cccccc))",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {out.length === 0 ? (
            <span style={{ color: "var(--descriptionForeground, #666666)" }}>
              {sess
                ? `${selectedShell.icon} ${selectedShell.label} • Terminal ready (${sess.type})`
                : "No terminal session. Click + to create one."}
            </span>
          ) : (
            out.map((line, i) => (
              <div
                key={i}
                style={{
                  minHeight: "1.5em",
                  color:
                    line.startsWith("[BLOCKED]") || line.includes("error")
                      ? "#f44747"
                      : line.startsWith("[APPROVAL REQUIRED]")
                        ? "#e8a838"
                        : "#cccccc",
                }}
              >
                {line}
              </div>
            ))
          )}
        </div>
        {sess && sessionId === activeSessionId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 12px",
              borderTop: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))",
              backgroundColor: "var(--panelHeader-background, var(--panel-background, #252526))",
            }}
          >
            <span
              style={{
                color: "var(--focusBorder, #4ec9b0)",
                 fontFamily: terminalSettings.fontFamily,
                 fontSize: `${terminalSettings.fontSize}px`,
                marginRight: 8,
              }}
            >
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command…"
              aria-label="Terminal input"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--terminal-foreground, var(--editor-foreground, #cccccc))",
                fontFamily: terminalSettings.fontFamily,
                fontSize: `${terminalSettings.fontSize}px`,
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--terminal-background, var(--editor-background, #1e1e1e))",
      }}
    >
      {/* Session tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--panelHeader-background, var(--panel-background, #252526))",
          borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))",
          minHeight: 32,
          padding: "0 4px",
          gap: 2,
          flexWrap: "nowrap",
          overflow: "auto",
        }}
      >
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "12px",
              flexShrink: 0,
              color: session.id === activeSessionId ? "var(--tab-activeForeground, #ffffff)" : "var(--tab-inactiveForeground, #969696)",
              backgroundColor:
                session.id === activeSessionId ? "var(--tab-activeBackground, var(--editor-background, #1e1e1e))" : "transparent",
              borderRadius: "3px 3px 0 0",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor:
                  session.status === "running"
                    ? "#4ec9b0"
                    : session.status === "error"
                      ? "#f44747"
                      : "#969696",
                flexShrink: 0,
              }}
            />
            <span>{session.label}</span>
            <button
              type="button"
              title="Close terminal"
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#666666",
                cursor: "pointer",
                fontSize: 12,
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: 4,
            gap: 2,
          }}
        >
          <button
            type="button"
            title="New Terminal"
            onClick={() => setShowShellPicker((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "#969696",
              cursor: "pointer",
              fontSize: "14px",
              padding: "4px 6px",
            }}
          >
            +
          </button>
          {sessions.length > 0 && (
            <>
              <button
                type="button"
                title="Split Terminal Horizontal"
                onClick={() =>
                  setSplitDirection(
                    splitDirection === "horizontal" ? null : "horizontal",
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  color:
                    splitDirection === "horizontal" ? "#007acc" : "#969696",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px 6px",
                }}
              >
                ⊟
              </button>
              <button
                type="button"
                title="Split Terminal Vertical"
                onClick={() =>
                  setSplitDirection(
                    splitDirection === "vertical" ? null : "vertical",
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  color: splitDirection === "vertical" ? "#007acc" : "#969696",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px 6px",
                }}
              >
                ◫
              </button>
              <button
                type="button"
                title="Environment Variables"
                onClick={() => setShowEnvVars((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: showEnvVars ? "#007acc" : "#969696",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px 6px",
                }}
              >
                ⚙
              </button>
              <button
                type="button"
                title="Command History"
                onClick={() => setShowHistory((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: showHistory ? "#007acc" : "#969696",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px 6px",
                }}
              >
                📜
              </button>
            </>
          )}
        </div>

        {/* Shell picker dropdown */}
        {showShellPicker && (
          <div
            style={{
              position: "absolute",
              top: 32,
              left: 8,
              zIndex: 1000,
              background: "var(--panel-background, var(--editorWidget-background, #252526))",
              border: "1px solid var(--sideBar-border, #454545)",
              borderRadius: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              minWidth: 180,
            }}
          >
            {SHELL_PROFILES.map((shell) => (
              <button
                key={shell.id}
                type="button"
                onClick={() => {
                  setSelectedShell(shell);
                  createSession(shell.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  color: "var(--editor-foreground, #cccccc)",
                  cursor: "pointer",
                  fontSize: 12,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--list-hoverBackground, var(--list-activeSelectionBackground, #094771))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                <span>{shell.icon}</span>
                <span>{shell.label}</span>
                {shell.id === selectedShell.id && (
                  <span
                    style={{
                      marginLeft: "auto",
                      color: "var(--focusBorder, #4ec9b0)",
                      fontSize: 11,
                    }}
                  >
                    ●
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main terminal area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: splitDirection === "horizontal" ? "column" : "row",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {terminalArea(activeSessionId)}

        {splitDirection && sessions.length > 0 && (
          <>
            <div
              style={{
                width: splitDirection === "vertical" ? 1 : "100%",
                height: splitDirection === "horizontal" ? 1 : "100%",
                background: "#333333",
                flexShrink: 0,
              }}
            />
            {terminalArea(
              sessions.find((s) => s.id !== activeSessionId)?.id ??
                activeSessionId,
            )}
          </>
        )}
      </div>

      {/* Environment Variables overlay */}
      {showEnvVars && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 8,
            zIndex: 1000,
            background: "var(--panel-background, var(--editorWidget-background, #252526))",
            border: "1px solid var(--sideBar-border, #454545)",
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            width: 360,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: "bold" }}>
              Environment Variables
            </span>
            <button
              type="button"
              onClick={() => setShowEnvVars(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--icon-foreground, #969696)",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: 8 }}>
            {envVars.map((env, i) => (
              <div key={i} style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                <input
                  type="text"
                  value={env.key}
                  onChange={(e) =>
                    setEnvVars((prev) =>
                      prev.map((v, j) =>
                        j === i ? { ...v, key: e.target.value } : v,
                      ),
                    )
                  }
                  style={{
                    flex: 1,
                    background: "var(--input-background, #3c3c3c)",
                    border: "1px solid var(--input-border, #555555)",
                    color: "var(--input-foreground, #cccccc)",
                    borderRadius: 3,
                    padding: "3px 6px",
                    fontSize: 11,
                  }}
                  placeholder="KEY"
                />
                <input
                  type="text"
                  value={env.value}
                  onChange={(e) =>
                    setEnvVars((prev) =>
                      prev.map((v, j) =>
                        j === i ? { ...v, value: e.target.value } : v,
                      ),
                    )
                  }
                  style={{
                    flex: 2,
                    background: "var(--input-background, #3c3c3c)",
                    border: "1px solid var(--input-border, #555555)",
                    color: "var(--input-foreground, #cccccc)",
                    borderRadius: 3,
                    padding: "3px 6px",
                    fontSize: 11,
                  }}
                  placeholder="value"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEnvVars((prev) => prev.filter((_, j) => j !== i))
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#f44747",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: "0 4px",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setEnvVars((prev) => [...prev, { key: "", value: "" }])
              }
              style={{
                background: "transparent",
                border: "1px dashed var(--sideBar-border, #555555)",
                color: "var(--icon-foreground, #969696)",
                borderRadius: 3,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 11,
                width: "100%",
                marginTop: 4,
              }}
            >
              + Add Variable
            </button>
          </div>
        </div>
      )}

      {/* Command History overlay */}
      {showHistory && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: showEnvVars ? 376 : 8,
            zIndex: 1000,
            background: "var(--panel-background, var(--editorWidget-background, #252526))",
            border: "1px solid var(--sideBar-border, #454545)",
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            width: 320,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #333333))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: "bold" }}>
              Command History
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setCommandHistory([])}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--icon-foreground, #969696)",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--icon-foreground, #969696)",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          </div>
          <div>
            {commandHistory.length === 0 ? (
              <div
                style={{ padding: "8px 12px", color: "var(--descriptionForeground, #666666)", fontSize: 12 }}
              >
                No command history yet.
              </div>
            ) : (
              commandHistory.map((cmd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInput(cmd);
                    setShowHistory(false);
                    inputRef.current?.focus();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "5px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--panelSection-border, var(--sideBar-border, #2d2d2d))",
                    color: "var(--editor-foreground, #cccccc)",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                    fontFamily: "monospace",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--list-hoverBackground, var(--list-activeSelectionBackground, #094771))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  {cmd}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FS-backed command interpreter ────────────────────────────────────────────

let _cwd = "/project";

async function handleCommand(
  cmd: string,
  workspace: WorkspaceManager,
): Promise<string> {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase() ?? "";
  const args = parts.slice(1);

  try {
    if (!workspace.isOpen()) {
      await workspace.openWorkspace({ root: "/project" });
    }
    switch (command) {
      case "pwd":
        return _cwd + "\n";
      case "ls":
      case "dir": {
        const path = args[0] ? resolveWd(args[0]) : _cwd;
        const entries = await workspace.listDirectory(path, { maxDepth: 0 });
        return (
          entries
            .map((e) => (e.isDirectory ? `${e.name}/` : e.name))
            .join("  ") + "\n"
        );
      }
      case "cd": {
        const target = args[0] ?? "/project";
        const newPath =
          target === ".."
            ? _cwd.split("/").slice(0, -1).join("/") || "/"
            : resolveWd(target);
        const stat = await workspace.stat(newPath).catch(() => null);
        if (!stat || !stat.isDirectory)
          return `cd: ${target}: Not a directory\n`;
        _cwd = newPath;
        return "";
      }
      case "cat": {
        if (!args[0]) return "cat: missing operand\n";
        const result = await workspace.readFile(resolveWd(args[0]));
        return result.content + "\n";
      }
      case "echo":
        return args.join(" ") + "\n";
      case "touch":
        if (!args[0]) return "touch: missing operand\n";
        await workspace.writeFile(resolveWd(args[0]), { content: "" });
        return "";
      case "mkdir":
        if (!args[0]) return "mkdir: missing operand\n";
        await workspace.createDirectory(resolveWd(args[0]));
        return "";
      case "rm":
        if (!args[0]) return "rm: missing operand\n";
        await workspace.deleteFile(resolveWd(args[0]));
        return "";
      case "mv":
        if (!args[0] || !args[1]) return "mv: missing operands\n";
        await workspace.renameFile(resolveWd(args[0]), resolveWd(args[1]));
        return "";
      case "clear":
        return "\x1b[2J\x1b[H";
      case "help":
        return "Commands: ls, pwd, cd, cat, echo, touch, mkdir, rm, mv, clear, help\n";
      default:
        return `${command}: command not found. Type 'help' for available commands.\n`;
    }
  } catch (e) {
    return `Error: ${String(e)}\n`;
  }
}

function resolveWd(path: string): string {
  if (path.startsWith("/")) return path;
  return `${_cwd}/${path}`.replace(/\/\//g, "/");
}
