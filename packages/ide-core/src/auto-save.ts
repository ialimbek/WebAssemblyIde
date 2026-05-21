/**
 * Auto-save Manager — debounced auto-save for open editor files.
 *
 * Integrates with:
 * - EditorManager (dirty state tracking)
 * - WorkspaceManager (file writes)
 * - SettingsManager (configurable delay)
 */

/** Auto-save configuration */
export interface AutoSaveConfig {
  /** Auto-save delay in ms after last edit (default: 1000) */
  debounceMs: number;
  /** Save on editor focus loss (default: true) */
  saveOnFocusLoss: boolean;
  /** Save on tab close (default: true) */
  saveOnTabClose: boolean;
  /** Save on IDE shutdown (default: true) */
  saveOnShutdown: boolean;
  /** Whether auto-save is enabled */
  enabled: boolean;
}

/** Default auto-save config */
const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  debounceMs: 1000,
  saveOnFocusLoss: true,
  saveOnTabClose: true,
  saveOnShutdown: true,
  enabled: true,
};

/** Save callback type */
export type SaveCallback = (uri: string) => Promise<void>;

/**
 * Auto-save Manager — coordinates debounced auto-saving.
 *
 * Usage:
 *   const autoSave = new AutoSaveManager(
 *     { debounceMs: 1000, enabled: true },
 *     async (uri) => { await workspaceManager.writeFile(uri, ...) }
 *   );
 *
 *   // When editor content changes:
 *   autoSave.markDirty("file:///test.ts");
 *
 *   // When file is manually saved:
 *   autoSave.markSaved("file:///test.ts");
 */
export class AutoSaveManager {
  private config: AutoSaveConfig;
  private saveCallback: SaveCallback;
  private pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
  private dirtyFiles = new Set<string>();
  private disposed = false;

  constructor(config?: Partial<AutoSaveConfig>, saveCallback?: SaveCallback) {
    this.config = { ...DEFAULT_AUTO_SAVE_CONFIG, ...config };
    this.saveCallback = saveCallback ?? (async () => {});
  }

  /**
   * Mark a file as dirty. Triggers debounced auto-save.
   */
  markDirty(uri: string): void {
    if (!this.config.enabled || this.disposed) return;

    this.dirtyFiles.add(uri);
    this.scheduleAutoSave(uri);
  }

  /**
   * Mark a file as saved (manually or by auto-save).
   */
  markSaved(uri: string): void {
    this.dirtyFiles.delete(uri);
    this.cancelPending(uri);
  }

  /**
   * Save all dirty files immediately.
   */
  async saveAll(): Promise<void> {
    const uris = Array.from(this.dirtyFiles);
    for (const uri of uris) {
      await this.saveFile(uri);
    }
  }

  /**
   * Save a specific file immediately (used by focus loss, tab close).
   */
  async saveFile(uri: string): Promise<void> {
    this.cancelPending(uri);

    try {
      await this.saveCallback(uri);
      this.dirtyFiles.delete(uri);
    } catch (err) {
      console.error(`[AutoSaveManager] Failed to save ${uri}:`, err);
    }
  }

  /**
   * Handle editor focus loss event.
   */
  async handleFocusLoss(): Promise<void> {
    if (this.config.saveOnFocusLoss) {
      await this.saveAll();
    }
  }

  /**
   * Handle tab close event.
   */
  async handleTabClose(uri: string): Promise<void> {
    if (this.config.saveOnTabClose) {
      await this.saveFile(uri);
    }
  }

  /**
   * Handle IDE shutdown event.
   */
  async handleShutdown(): Promise<void> {
    if (this.config.saveOnShutdown) {
      await this.saveAll();
    }
  }

  /**
   * Get dirty file count.
   */
  getDirtyCount(): number {
    return this.dirtyFiles.size;
  }

  /**
   * Check if there are pending saves.
   */
  hasPendingSaves(): boolean {
    return this.pendingSaves.size > 0;
  }

  /**
   * Update configuration.
   */
  updateConfig(patch: Partial<AutoSaveConfig>): void {
    Object.assign(this.config, patch);
  }

  /**
   * Get current configuration.
   */
  getConfig(): AutoSaveConfig {
    return this.config;
  }

  /**
   * Dispose all pending timers.
   */
  dispose(): void {
    this.disposed = true;
    for (const timer of this.pendingSaves.values()) {
      clearTimeout(timer);
    }
    this.pendingSaves.clear();
    this.dirtyFiles.clear();
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private scheduleAutoSave(uri: string): void {
    // Cancel existing timer for this file
    this.cancelPending(uri);

    // Schedule new save
    const timer = setTimeout(async () => {
      this.pendingSaves.delete(uri);
      await this.saveFile(uri);
    }, this.config.debounceMs);

    this.pendingSaves.set(uri, timer);
  }

  private cancelPending(uri: string): void {
    const timer = this.pendingSaves.get(uri);
    if (timer) {
      clearTimeout(timer);
      this.pendingSaves.delete(uri);
    }
  }
}
