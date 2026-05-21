/**
 * Undo/Redo Manager — command history stack for file operations and agent actions.
 *
 * Supports:
 * - Character-level undo (editor native, delegated to Monaco)
 * - File-level undo (file write/rename/delete operations)
 * - Transaction-level undo (agent multi-file patches)
 * - Cross-file undo (batch operations)
 * - Redo stack management
 */

import type { Disposable } from "@webassembly-ide/shared";

/** Operation type for undo entries */
export type UndoOperationType =
  | "fileContentChange"
  | "fileCreate"
  | "fileDelete"
  | "fileRename"
  | "agentPatch"
  | "batchOperation"
  | "configChange";

/** A single undo entry */
export interface UndoEntry {
  /** Unique entry ID */
  id: string;
  /** Type of operation */
  type: UndoOperationType;
  /** Human-readable description */
  description: string;
  /** Timestamp when the operation was performed */
  timestamp: number;
  /** Source of the operation (user, agent, system) */
  source: string;
  /** Undo function */
  undo: () => Promise<void>;
  /** Redo function */
  redo: () => Promise<void>;
  /** File paths affected */
  affectedPaths: string[];
  /** Whether this is part of a transaction group */
  transactionId?: string;
}

/** Transaction group for atomic undo */
export interface UndoTransaction {
  /** Transaction ID */
  id: string;
  /** Description of the transaction */
  description: string;
  /** Entries in this transaction */
  entries: UndoEntry[];
  /** Timestamp */
  timestamp: number;
  /** Source */
  source: string;
}

/** Undo/Redo manager configuration */
export interface UndoRedoConfig {
  /** Maximum undo stack size */
  maxUndoSize: number;
  /** Maximum redo stack size */
  maxRedoSize: number;
  /** Whether redo stack is cleared on new action */
  clearRedoOnNewAction: boolean;
}

/** Default config */
const DEFAULT_UNDO_REDO_CONFIG: UndoRedoConfig = {
  maxUndoSize: 100,
  maxRedoSize: 50,
  clearRedoOnNewAction: true,
};

/**
 * Undo/Redo Manager — manages operation history for undo/redo.
 *
 * Usage:
 *   const undoRedo = new UndoRedoManager();
 *
 *   // Record an operation
 *   undoRedo.push({
 *     type: "fileContentChange",
 *     description: "Edit main.ts",
 *     source: "user",
 *     affectedPaths: ["main.ts"],
 *     undo: async () => { // restore old content },
 *     redo: async () => { // re-apply new content },
 *   });
 *
 *   // Undo last operation
 *   await undoRedo.undo();
 *
 *   // Redo last undone operation
 *   await undoRedo.redo();
 */
export class UndoRedoManager {
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private config: UndoRedoConfig;
  private activeTransaction: UndoTransaction | null = null;
  private listeners = new Set<
    (event: "undo" | "redo" | "push", entry?: UndoEntry) => void
  >();

  constructor(config?: Partial<UndoRedoConfig>) {
    this.config = { ...DEFAULT_UNDO_REDO_CONFIG, ...config };
  }

  // ─── Push ─────────────────────────────────────────────────────────────

  /**
   * Push a new undo entry onto the stack.
   */
  push(entry: Omit<UndoEntry, "id" | "timestamp">): void {
    const fullEntry: UndoEntry = {
      ...entry,
      id: generateUndoId(),
      timestamp: Date.now(),
    };

    // If inside a transaction, add to transaction
    if (this.activeTransaction) {
      this.activeTransaction.entries.push(fullEntry);
      return;
    }

    // Clear redo stack on new action (if configured)
    if (this.config.clearRedoOnNewAction) {
      this.redoStack = [];
    }

    // Add to undo stack
    this.undoStack.push(fullEntry);

    // Trim if over limit
    if (this.undoStack.length > this.config.maxUndoSize) {
      this.undoStack = this.undoStack.slice(-this.config.maxUndoSize);
    }

    this.emit("push", fullEntry);
  }

  // ─── Undo / Redo ──────────────────────────────────────────────────────

  /**
   * Undo the last operation.
   */
  async undo(): Promise<UndoEntry | null> {
    const entry = this.undoStack.pop();
    if (!entry) return null;

    try {
      await entry.undo();
    } catch (err) {
      console.error("[UndoRedoManager] Undo failed:", err);
      // Push back onto undo stack on failure
      this.undoStack.push(entry);
      throw err;
    }

    // Move to redo stack
    this.redoStack.push(entry);
    if (this.redoStack.length > this.config.maxRedoSize) {
      this.redoStack = this.redoStack.slice(-this.config.maxRedoSize);
    }

    this.emit("undo", entry);
    return entry;
  }

  /**
   * Redo the last undone operation.
   */
  async redo(): Promise<UndoEntry | null> {
    const entry = this.redoStack.pop();
    if (!entry) return null;

    try {
      await entry.redo();
    } catch (err) {
      console.error("[UndoRedoManager] Redo failed:", err);
      // Push back onto redo stack on failure
      this.redoStack.push(entry);
      throw err;
    }

    // Move back to undo stack
    this.undoStack.push(entry);

    this.emit("redo", entry);
    return entry;
  }

  // ─── Transactions ─────────────────────────────────────────────────────

  /**
   * Begin a transaction. All undo entries until endTransaction()
   * are grouped together for atomic undo.
   */
  beginTransaction(description: string, source = "agent"): string {
    if (this.activeTransaction) {
      console.warn(
        "[UndoRedoManager] Transaction already active, nesting not supported",
      );
      return this.activeTransaction.id;
    }

    const id = generateUndoId();
    this.activeTransaction = {
      id,
      description,
      entries: [],
      timestamp: Date.now(),
      source,
    };

    return id;
  }

  /**
   * End the current transaction and push it as a single undo entry.
   */
  async endTransaction(): Promise<string | null> {
    const transaction = this.activeTransaction;
    if (!transaction) return null;

    this.activeTransaction = null;

    if (transaction.entries.length === 0) return transaction.id;

    // Create a combined undo entry
    const combinedEntry: UndoEntry = {
      id: transaction.id,
      type: "batchOperation",
      description: transaction.description,
      timestamp: transaction.timestamp,
      source: transaction.source,
      affectedPaths: [
        ...new Set(transaction.entries.flatMap((e) => e.affectedPaths)),
      ],
      transactionId: transaction.id,
      undo: async () => {
        // Undo in reverse order
        for (let i = transaction.entries.length - 1; i >= 0; i--) {
          await transaction.entries[i].undo();
        }
      },
      redo: async () => {
        // Redo in forward order
        for (const entry of transaction.entries) {
          await entry.redo();
        }
      },
    };

    this.push(combinedEntry);
    return transaction.id;
  }

  /**
   * Cancel the current transaction without pushing.
   */
  cancelTransaction(): void {
    this.activeTransaction = null;
  }

  // ─── Query ─────────────────────────────────────────────────────────────

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the description of the next undo operation.
   */
  peekUndo(): string | null {
    return this.undoStack[this.undoStack.length - 1]?.description ?? null;
  }

  /**
   * Get the description of the next redo operation.
   */
  peekRedo(): string | null {
    return this.redoStack[this.redoStack.length - 1]?.description ?? null;
  }

  /**
   * Get undo stack size.
   */
  getUndoSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get redo stack size.
   */
  getRedoSize(): number {
    return this.redoStack.length;
  }

  /**
   * Get undo history for visualization.
   */
  getUndoHistory(): Array<{
    description: string;
    timestamp: number;
    source: string;
  }> {
    return this.undoStack.map((e) => ({
      description: e.description,
      timestamp: e.timestamp,
      source: e.source,
    }));
  }

  /**
   * Get redo history for visualization.
   */
  getRedoHistory(): Array<{
    description: string;
    timestamp: number;
    source: string;
  }> {
    return this.redoStack.map((e) => ({
      description: e.description,
      timestamp: e.timestamp,
      source: e.source,
    }));
  }

  /**
   * Check if a transaction is active.
   */
  isTransactionActive(): boolean {
    return this.activeTransaction !== null;
  }

  // ─── Listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for undo/redo events.
   */
  onEvent(
    listener: (event: "undo" | "redo" | "push", entry?: UndoEntry) => void,
  ): Disposable {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  // ─── Dispose ───────────────────────────────────────────────────────────

  dispose(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.activeTransaction = null;
    this.listeners.clear();
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private emit(event: "undo" | "redo" | "push", entry?: UndoEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(event, entry);
      } catch (err) {
        console.error("[UndoRedoManager] Listener error:", err);
      }
    }
  }
}

// ─── Utility ────────────────────────────────────────────────────────────

let undoIdCounter = 0;

function generateUndoId(): string {
  return `undo-${Date.now()}-${++undoIdCounter}`;
}
