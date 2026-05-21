/**
 * Terminal Runtime — session management for IDE terminal panels.
 *
 * Manages terminal sessions with:
 * - Multiple session types (user, agent, task, scratchpad)
 * - Output stream buffering and parsing
 * - Command policy integration
 * - Status tracking
 */

import type { Disposable } from "@webassembly-ide/shared";
import { generateId } from "@webassembly-ide/shared";

/** Terminal session status */
export type TerminalStatus =
  | "idle"
  | "running"
  | "exited"
  | "error"
  | "connecting";

/** Terminal session type */
export type TerminalSessionType = "user" | "agent" | "task" | "scratchpad";

/** Terminal output chunk */
export interface TerminalOutputChunk {
  /** Session ID */
  sessionId: string;
  /** Output data */
  data: string;
  /** Output stream type */
  stream: "stdout" | "stderr";
  /** Timestamp */
  timestamp: number;
}

/** Terminal session options */
export interface TerminalSessionOptions {
  /** Session type */
  type: TerminalSessionType;
  /** Shell command to run (default: platform shell) */
  shell?: string;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Session label for display */
  label?: string;
}

/** Terminal session state */
export interface TerminalSession {
  /** Unique session ID */
  id: string;
  /** Session type */
  type: TerminalSessionType;
  /** Session label */
  label: string;
  /** Current status */
  status: TerminalStatus;
  /** Working directory */
  cwd: string;
  /** When the session was created */
  createdAt: number;
  /** Last activity timestamp */
  lastActivityAt: number;
  /** Exit code (if exited) */
  exitCode?: number;
  /** Buffered output lines (limited) */
  outputBuffer: string[];
  /** Current command being executed */
  currentCommand?: string;
}

/** Maximum output buffer lines per session */
const MAX_OUTPUT_BUFFER_LINES = 5000;

/**
 * Terminal Session Manager — manages terminal session lifecycle.
 *
 * This is the core runtime for terminal panels. It:
 * - Creates and tracks terminal sessions
 * - Buffers output for context engine consumption
 * - Integrates with CommandPolicyGuard for command safety
 * - Emits events for UI and agent consumption
 *
 * Note: Actual PTY/process management is delegated to platform-specific
 * adapters (Tauri native PTY for desktop, remote runner for browser).
 * This class manages the session state layer.
 */
export class TerminalSessionManager {
  private sessions = new Map<string, TerminalSession>();
  private outputListeners = new Set<(chunk: TerminalOutputChunk) => void>();
  private statusListeners = new Set<
    (sessionId: string, status: TerminalStatus) => void
  >();
  private maxSessions = 10;

  // ─── Session Lifecycle ───────────────────────────────────────────────

  /**
   * Create a new terminal session.
   */
  createSession(options: TerminalSessionOptions): TerminalSession {
    if (this.sessions.size >= this.maxSessions) {
      // Close the oldest non-user session
      const oldest = Array.from(this.sessions.values()).find(
        (s) => s.type !== "user",
      );
      if (oldest) {
        this.closeSession(oldest.id);
      } else {
        throw new Error(
          `Maximum number of terminal sessions (${this.maxSessions}) reached`,
        );
      }
    }

    const id = generateId();
    const session: TerminalSession = {
      id,
      type: options.type,
      label: options.label ?? `${options.type} (${this.sessions.size + 1})`,
      status: "idle",
      cwd: options.cwd ?? "/",
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      outputBuffer: [],
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Close a terminal session.
   */
  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = "exited";
    this.sessions.delete(sessionId);
    this.emitStatusChange(sessionId, "exited");
    return true;
  }

  /**
   * Close all sessions.
   */
  closeAllSessions(): void {
    for (const session of Array.from(this.sessions.values())) {
      this.closeSession(session.id);
    }
  }

  // ─── Session Query ───────────────────────────────────────────────────

  /**
   * Get a session by ID.
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions.
   */
  getSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions by type.
   */
  getSessionsByType(type: TerminalSessionType): TerminalSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.type === type);
  }

  /**
   * Get the count of active sessions.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  // ─── Output Management ───────────────────────────────────────────────

  /**
   * Append output to a session's buffer.
   * Called by platform-specific PTY adapters.
   */
  appendOutput(
    sessionId: string,
    data: string,
    stream: "stdout" | "stderr" = "stdout",
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.lastActivityAt = Date.now();

    // Split into lines and add to buffer
    const lines = data.split("\n");
    session.outputBuffer.push(...lines);

    // Trim buffer if too large
    if (session.outputBuffer.length > MAX_OUTPUT_BUFFER_LINES) {
      session.outputBuffer = session.outputBuffer.slice(
        -MAX_OUTPUT_BUFFER_LINES,
      );
    }

    // Emit output chunk
    const chunk: TerminalOutputChunk = {
      sessionId,
      data,
      stream,
      timestamp: Date.now(),
    };

    for (const listener of this.outputListeners) {
      try {
        listener(chunk);
      } catch (err) {
        console.error("[TerminalSessionManager] Output listener error:", err);
      }
    }
  }

  /**
   * Get buffered output for a session.
   */
  getOutput(sessionId: string, lines?: number): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    if (lines && lines > 0) {
      return session.outputBuffer.slice(-lines);
    }
    return [...session.outputBuffer];
  }

  /**
   * Clear output buffer for a session.
   */
  clearOutput(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.outputBuffer = [];
    }
  }

  // ─── Status Management ───────────────────────────────────────────────

  /**
   * Set session status.
   * Called by platform-specific PTY adapters.
   */
  setSessionStatus(sessionId: string, status: TerminalStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = status;
    session.lastActivityAt = Date.now();
    this.emitStatusChange(sessionId, status);
  }

  /**
   * Set the current command being executed in a session.
   */
  setCurrentCommand(sessionId: string, command: string | undefined): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentCommand = command;
    session.lastActivityAt = Date.now();
  }

  // ─── Listeners ───────────────────────────────────────────────────────

  /**
   * Listen for terminal output from any session.
   */
  onOutput(listener: (chunk: TerminalOutputChunk) => void): Disposable {
    this.outputListeners.add(listener);
    return { dispose: () => this.outputListeners.delete(listener) };
  }

  /**
   * Listen for session status changes.
   */
  onStatusChange(
    listener: (sessionId: string, status: TerminalStatus) => void,
  ): Disposable {
    this.statusListeners.add(listener);
    return { dispose: () => this.statusListeners.delete(listener) };
  }

  // ─── Dispose ─────────────────────────────────────────────────────────

  dispose(): void {
    this.closeAllSessions();
    this.outputListeners.clear();
    this.statusListeners.clear();
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private emitStatusChange(sessionId: string, status: TerminalStatus): void {
    for (const listener of this.statusListeners) {
      try {
        listener(sessionId, status);
      } catch (err) {
        console.error("[TerminalSessionManager] Status listener error:", err);
      }
    }
  }
}
