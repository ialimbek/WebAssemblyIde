/**
 * AgentSession — manages a single agent conversation session.
 * Handles message history, state transitions, and mode switching.
 */

import type {
  AgentMode,
  AgentSessionState,
  AgentSessionConfig,
  AgentMessage,
  ToolCall,
  ToolResult,
  PermissionLevel,
  AgentEvent,
} from "./types";

type EventListener = (event: AgentEvent) => void;

export class AgentSession {
  readonly id: string;
  private mode: AgentMode;
  private state: AgentSessionState = "idle";
  private permissionLevel: PermissionLevel;
  private messages: AgentMessage[] = [];
  private listeners: EventListener[] = [];
  private providerId?: string;
  private modelId?: string;
  private systemPrompt?: string;

  constructor(config: AgentSessionConfig) {
    this.id = config.id;
    this.mode = config.mode;
    this.permissionLevel = config.permissionLevel;
    this.providerId = config.providerId;
    this.modelId = config.modelId;
    this.systemPrompt = config.systemPrompt;

    if (this.systemPrompt) {
      this.addMessage({
        id: `${this.id}-system-0`,
        role: "system",
        content: this.systemPrompt,
        timestamp: Date.now(),
      });
    }
  }

  // ── Getters ──

  getMode(): AgentMode {
    return this.mode;
  }

  getState(): AgentSessionState {
    return this.state;
  }

  getPermissionLevel(): PermissionLevel {
    return this.permissionLevel;
  }

  getMessages(): readonly AgentMessage[] {
    return this.messages;
  }

  getLastAssistantMessage(): AgentMessage | undefined {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === "assistant") return this.messages[i];
    }
    return undefined;
  }

  getProviderId(): string | undefined {
    return this.providerId;
  }

  getModelId(): string | undefined {
    return this.modelId;
  }

  // ── State transitions ──

  setState(newState: AgentSessionState): void {
    const oldState = this.state;
    this.state = newState;
    this.emit({
      type: "agent.session.state_changed",
      sessionId: this.id,
      timestamp: Date.now(),
      payload: { from: oldState, to: newState },
    });
  }

  setMode(newMode: AgentMode): void {
    const oldMode = this.mode;
    this.mode = newMode;
    this.emit({
      type: "agent.mode.changed",
      sessionId: this.id,
      timestamp: Date.now(),
      payload: { from: oldMode, to: newMode },
    });
  }

  setPermissionLevel(level: PermissionLevel): void {
    this.permissionLevel = level;
  }

  setProvider(providerId: string, modelId?: string): void {
    this.providerId = providerId;
    this.modelId = modelId;
  }

  // ── Messages ──

  addMessage(message: AgentMessage): void {
    this.messages.push(message);
    this.emit({
      type: "agent.message.added",
      sessionId: this.id,
      timestamp: Date.now(),
      payload: message,
    });
  }

  addUserMessage(content: string): AgentMessage {
    const msg: AgentMessage = {
      id: `${this.id}-user-${this.messages.length}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    this.addMessage(msg);
    return msg;
  }

  addAssistantMessage(content: string, toolCalls?: ToolCall[]): AgentMessage {
    const msg: AgentMessage = {
      id: `${this.id}-assistant-${this.messages.length}`,
      role: "assistant",
      content,
      timestamp: Date.now(),
      toolCalls,
    };
    this.addMessage(msg);
    return msg;
  }

  addToolResultMessage(toolCall: ToolCall, result: ToolResult): AgentMessage {
    const msg: AgentMessage = {
      id: `${this.id}-tool-${this.messages.length}`,
      role: "tool",
      content: result.output,
      timestamp: Date.now(),
      toolCalls: [toolCall],
      toolResults: [result],
    };
    this.addMessage(msg);
    return msg;
  }

  // ── Message serialization for LLM API ──

  toApiMessages(): Array<{ role: string; content: string }> {
    return this.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  clearMessages(): void {
    this.messages = [];
  }

  // ── Events ──

  onEvent(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private emit(event: AgentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Swallow listener errors to not break session
      }
    }
  }

  // ── Serialization ──

  toJSON(): {
    id: string;
    mode: AgentMode;
    state: AgentSessionState;
    permissionLevel: PermissionLevel;
    messageCount: number;
    providerId?: string;
    modelId?: string;
  } {
    return {
      id: this.id,
      mode: this.mode,
      state: this.state,
      permissionLevel: this.permissionLevel,
      messageCount: this.messages.length,
      providerId: this.providerId,
      modelId: this.modelId,
    };
  }
}
