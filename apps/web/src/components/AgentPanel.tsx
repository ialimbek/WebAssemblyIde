/**
 * AgentPanel — Chat/Plan/Act mode interface for AI agent interaction.
 * Displays agent messages, plans, and approval requests.
 */

import React, { useState, useRef, useEffect } from "react";
import { useIDE } from "../ide-context.js";

export function AgentPanel() {
  const { agent } = useIDE();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"chat" | "plan" | "act">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const session = agent.getSession();
  const messages = session.getMessages();
  const currentPlan = agent.getCurrentPlan();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const switchMode = (newMode: "chat" | "plan" | "act") => {
    setMode(newMode);
    const agentMode =
      newMode === "act" ? "act" : newMode === "plan" ? "plan" : "chat";
    agent.getSession().setMode(agentMode);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");

    await agent.processUserMessage(currentInput, {
      workspaceFiles: [],
      activeFile: undefined,
      recentFiles: [],
      gitDiff: undefined,
      userMessage: currentInput,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExecutePlan = async () => {
    await agent.executePlan();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--sideBar-background, #252526)",
        color: "var(--sideBar-foreground, #cccccc)",
        fontSize: 13,
      }}
    >
      {/* Agent Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid rgba(128,128,128,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 12 }}>🤖 Agent</span>
        <div style={{ display: "flex", gap: 4 }}>
          {(["chat", "plan", "act"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                padding: "4px 8px",
                background:
                  mode === m
                    ? "var(--button-background, #0e639c)"
                    : "transparent",
                border: "1px solid rgba(128,128,128,0.3)",
                color: "inherit",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                opacity: mode === m ? 1 : 0.6,
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            opacity: 0.6,
          }}
        >
          {session.getState()}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 12px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              opacity: 0.5,
              fontSize: 12,
            }}
          >
            Start a conversation with the AI agent.
            <br />
            Mode: {mode}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: 12,
              padding: "8px",
              borderRadius: 4,
              background:
                msg.role === "user"
                  ? "rgba(0, 122, 204, 0.1)"
                  : msg.role === "assistant"
                    ? "rgba(14, 99, 156, 0.1)"
                    : "transparent",
              borderLeft:
                msg.role === "user"
                  ? "2px solid #007acc"
                  : msg.role === "assistant"
                    ? "2px solid #0e639c"
                    : "none",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 4,
                opacity: 0.8,
              }}
            >
              {msg.role === "user"
                ? "👤 You"
                : msg.role === "assistant"
                  ? "🤖 Agent"
                  : "🔧 Tool"}
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {currentPlan && mode === "plan" && (
          <div
            style={{
              marginTop: 12,
              padding: "12px",
              background: "rgba(14, 99, 156, 0.1)",
              border: "1px solid rgba(14, 99, 156, 0.3)",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              📋 Current Plan
            </div>
            <div style={{ marginBottom: 8, fontSize: 12 }}>
              <strong>Goal:</strong> {currentPlan.goal}
            </div>
            <div style={{ marginBottom: 8 }}>
              {currentPlan.steps.map((step) => (
                <div
                  key={step.id}
                  style={{
                    padding: "4px 8px",
                    marginBottom: 4,
                    background:
                      step.status === "completed"
                        ? "rgba(46, 160, 67, 0.1)"
                        : step.status === "failed"
                          ? "rgba(207, 34, 46, 0.1)"
                          : step.status === "executing"
                            ? "rgba(255, 165, 0, 0.1)"
                            : "transparent",
                    borderRadius: 3,
                    fontSize: 12,
                  }}
                >
                  <span style={{ marginRight: 8 }}>
                    {step.status === "completed"
                      ? "✅"
                      : step.status === "failed"
                        ? "❌"
                        : step.status === "executing"
                          ? "⏳"
                          : "⬜"}
                  </span>
                  {step.order}. {step.description} [{step.riskLevel}]
                </div>
              ))}
            </div>
            {currentPlan.risks.length > 0 && (
              <div style={{ marginBottom: 8, fontSize: 11, opacity: 0.8 }}>
                <strong>Risks:</strong>
                <ul style={{ margin: "4px 0 0 16px" }}>
                  {currentPlan.risks.map((risk, i) => (
                    <li key={i}>⚠️ {risk}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleExecutePlan}
              style={{
                padding: "6px 12px",
                background: "var(--button-background, #0e639c)",
                border: "1px solid rgba(128,128,128,0.3)",
                color: "white",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Execute Plan
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid rgba(128,128,128,0.2)",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "chat"
              ? "Ask the agent anything..."
              : mode === "plan"
                ? "Describe what you want to plan..."
                : "Describe a task to execute..."
          }
          style={{
            width: "100%",
            minHeight: 40,
            maxHeight: 120,
            padding: "8px",
            background: "var(--input-background, #3c3c3c)",
            border: "1px solid transparent",
            color: "var(--input-foreground, #cccccc)",
            borderRadius: 3,
            fontSize: 13,
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <div
          style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}
        >
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: "6px 16px",
              background: !input.trim()
                ? "transparent"
                : "var(--button-background, #0e639c)",
              border: "1px solid rgba(128,128,128,0.3)",
              color: "inherit",
              borderRadius: 3,
              cursor: !input.trim() ? "not-allowed" : "pointer",
              fontSize: 12,
              fontWeight: 600,
              opacity: !input.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
