/**
 * TerminalPanel — terminal session UI component.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useIDE } from "../ide-context.js";
import type { TerminalSession } from "@webassembly-ide/ide-core";

export function TerminalPanel() {
  const { terminal, commandPolicy } = useIDE();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  // Refresh sessions
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

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  const createSession = () => {
    terminal.createSession({
      type: "user",
      label: `Terminal ${sessions.length + 1}`,
    });
    refreshSessions();
  };

  const executeCommand = () => {
    if (!activeSessionId || !input.trim()) return;

    const policy = commandPolicy.evaluate(input);
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
        `[APPROVAL REQUIRED] ${policy.reason}: ${input}\n`,
        "stdout",
      );
      // In a real implementation, this would show an approval dialog
    }

    terminal.appendOutput(activeSessionId, `$ ${input}\n`);
    terminal.setCurrentCommand(activeSessionId, input);
    terminal.setSessionStatus(activeSessionId, "running");

    // Simulate command execution (in real impl, this goes to PTY adapter)
    setTimeout(() => {
      if (activeSessionId) {
        terminal.appendOutput(
          activeSessionId,
          `[simulated output for: ${input}]\n`,
        );
        terminal.setCurrentCommand(activeSessionId, undefined);
        terminal.setSessionStatus(activeSessionId, "idle");
      }
    }, 500);

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  const activeSession = activeSessionId
    ? terminal.getSession(activeSessionId)
    : null;
  const output = activeSessionId ? terminal.getOutput(activeSessionId) : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#1e1e1e",
      }}
    >
      {/* Session Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#252526",
          borderBottom: "1px solid #2d2d2d",
          minHeight: 32,
          padding: "0 4px",
        }}
      >
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setActiveSessionId(session.id)}
            style={{
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "12px",
              color: session.id === activeSessionId ? "#ffffff" : "#969696",
              backgroundColor:
                session.id === activeSessionId ? "#1e1e1e" : "transparent",
              borderRadius: "3px 3px 0 0",
              display: "flex",
              alignItems: "center",
              gap: 4,
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
              }}
            />
            {session.label}
          </div>
        ))}
        <button
          onClick={createSession}
          style={{
            background: "none",
            border: "none",
            color: "#969696",
            cursor: "pointer",
            fontSize: "14px",
            padding: "4px 8px",
          }}
          title="New Terminal"
        >
          +
        </button>
      </div>

      {/* Output Area */}
      <div
        ref={outputRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 12px",
          fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
          fontSize: "13px",
          lineHeight: "1.5",
          color: "#cccccc",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {output.length === 0 ? (
          <span style={{ color: "#666666" }}>
            {activeSession
              ? `Terminal ready (${activeSession.type})`
              : "No terminal session. Click + to create one."}
          </span>
        ) : (
          output.map((line, i) => (
            <div key={i} style={{ minHeight: "1.5em" }}>
              {line}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      {activeSession && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 12px",
            borderTop: "1px solid #2d2d2d",
            backgroundColor: "#252526",
          }}
        >
          <span
            style={{
              color: "#4ec9b0",
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: "13px",
              marginRight: 8,
            }}
          >
            $
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#cccccc",
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: "13px",
            }}
          />
        </div>
      )}
    </div>
  );
}
