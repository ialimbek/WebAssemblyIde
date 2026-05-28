/**
 * Editor Manager — high-level editor coordination.
 *
 * Manages:
 * - Multi-tab state (active tab, preview tabs, tab ordering)
 * - Coordinates EditorModelManager for file lifecycle
 * - Provides command bus integration points
 * - Tracks cursor position
 */

import type { Disposable } from "@webassembly-ide/shared";
import { EditorModelManager, extractFileName } from "./editor-model.js";
import type {
  FileUri,
  EditorTab,
  EditorModelInfo,
  EditorConfig,
  Position,
} from "./types.js";
import { DEFAULT_EDITOR_CONFIG } from "./types.js";

/** Maximum number of pinned tabs before oldest is closed */
const MAX_OPEN_TABS = 50;

/**
 * EditorManager — manages editor tabs, active file, and coordinates
 * the model manager with the UI layer.
 */
export class EditorManager {
  readonly models: EditorModelManager;
  private tabs: EditorTab[] = [];
  private activeUri: FileUri | null = null;
  private cursorPositions = new Map<FileUri, Position>();
  private config: Required<EditorConfig>;
  private tabListeners = new Set<(tabs: EditorTab[]) => void>();
  private activeTabListeners = new Set<
    (uri: FileUri | null, previousUri: FileUri | null) => void
  >();
  private configListeners = new Set<(config: Required<EditorConfig>) => void>();
  private revealRequests = new Set<
    (uri: FileUri, position: Position) => void
  >();

  constructor(config?: EditorConfig) {
    this.models = new EditorModelManager();
    this.config = { ...DEFAULT_EDITOR_CONFIG, ...config };

    this.models.onDirtyStateChanged((uri, isDirty) => {
      this.setTabDirty(uri, isDirty);
    });
  }

  // ─── File Operations ───────────────────────────────────────────────────

  /**
   * Open a file in the editor.
   * If already open, activates its tab.
   * If opened from preview, replaces the preview tab.
   */
  openFile(
    uri: FileUri,
    content: string,
    options?: {
      languageId?: string;
      isReadOnly?: boolean;
      asPreview?: boolean;
    },
  ): EditorModelInfo {
    // Open or get existing model
    const info = this.models.openFile(uri, content, options);

    // Check if tab already exists
    const existingTab = this.tabs.find((t) => t.uri === uri);
    if (existingTab) {
      this.activateTab(uri);
      return info;
    }

    // Replace preview tab if opening as preview
    if (options?.asPreview !== false) {
      const previewTab = this.tabs.find((t) => t.isPreview);
      if (previewTab) {
        this.closeTab(previewTab.uri);
      }
    }

    // Enforce max tabs
    if (this.tabs.length >= MAX_OPEN_TABS) {
      const nonPinned = this.tabs.filter((t) => !t.isPinned);
      if (nonPinned.length > 0) {
        this.closeTab(nonPinned[0].uri);
      }
    }

    // Create new tab
    const tab: EditorTab = {
      uri,
      title: info.fileName,
      isDirty: false,
      isActive: false,
      isPreview: options?.asPreview !== false,
    };

    this.tabs.push(tab);
    this.activateTab(uri);
    this.emitTabsChanged();

    return info;
  }

  /**
   * Reload an already-open file with content read from disk without marking it dirty.
   */
  reloadFile(uri: FileUri, content: string): boolean {
    const reloaded = this.models.replaceContent(uri, content, {
      markDirty: false,
    });
    if (reloaded) {
      this.setTabDirty(uri, false);
    }
    return reloaded;
  }

  /**
   * Rename an open file, updating its URI and tab info.
   */
  renameFile(oldUri: FileUri, newUri: FileUri): boolean {
    const success = this.models.renameModel(oldUri, newUri);
    if (!success) return false;

    // Update tab
    const tab = this.tabs.find((t) => t.uri === oldUri);
    if (tab) {
      tab.uri = newUri;
      tab.title = extractFileName(newUri);
    }

    // Update active URI
    if (this.activeUri === oldUri) {
      this.activeUri = newUri;
      this.emitActiveTabChanged(newUri, oldUri);
    }

    // Update cursor positions
    const cursor = this.cursorPositions.get(oldUri);
    if (cursor) {
      this.cursorPositions.delete(oldUri);
      this.cursorPositions.set(newUri, cursor);
    }

    this.emitTabsChanged();
    return true;
  }

  /**
   * Close a tab and optionally its model.
   */
  closeTab(uri: FileUri): boolean {
    const index = this.tabs.findIndex((t) => t.uri === uri);
    if (index === -1) return false;

    this.tabs.splice(index, 1);

    // If closing the active tab, activate the next available tab
    if (this.activeUri === uri) {
      const previousUri = this.activeUri;
      if (this.tabs.length > 0) {
        const nextIndex = Math.min(index, this.tabs.length - 1);
        this.activateTab(this.tabs[nextIndex].uri);
      } else {
        this.activeUri = null;
        this.emitActiveTabChanged(null, previousUri);
      }
    }

    this.models.closeFile(uri);
    this.cursorPositions.delete(uri);
    this.emitTabsChanged();
    return true;
  }

  /**
   * Close all tabs.
   */
  closeAllTabs(): void {
    const uris = this.tabs.map((t) => t.uri);
    for (const uri of uris) {
      this.closeTab(uri);
    }
  }

  /**
   * Activate a tab by URI.
   */
  activateTab(uri: FileUri): boolean {
    if (this.activeUri === uri) return true;

    const tab = this.tabs.find((t) => t.uri === uri);
    if (!tab) return false;

    const previousUri = this.activeUri;

    // Deactivate current tab
    const currentActive = this.tabs.find((t) => t.isActive);
    if (currentActive) {
      currentActive.isActive = false;
    }

    // Activate new tab
    tab.isActive = true;
    tab.isPreview = false; // Promoting from preview to pinned
    this.activeUri = uri;

    this.emitTabsChanged();
    this.emitActiveTabChanged(uri, previousUri);
    return true;
  }

  /**
   * Mark a tab as dirty/clean.
   */
  setTabDirty(uri: FileUri, isDirty: boolean): void {
    const tab = this.tabs.find((t) => t.uri === uri);
    if (tab && tab.isDirty !== isDirty) {
      tab.isDirty = isDirty;
      this.emitTabsChanged();
    }
  }

  /** Reorder an editor tab for drag-and-drop tab management. */
  reorderTab(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tabs.length ||
      toIndex >= this.tabs.length ||
      fromIndex === toIndex
    ) {
      return false;
    }

    const [tab] = this.tabs.splice(fromIndex, 1);
    this.tabs.splice(toIndex, 0, tab);

    const allBeforePinned =
      toIndex === 0 || this.tabs.slice(0, toIndex).every((t) => t.isPinned);
    if (allBeforePinned && !tab.isPinned) {
      tab.isPinned = true;
      tab.isPreview = false;
    }

    this.emitTabsChanged();
    return true;
  }

  /** Toggle tab pinning/fixed-tab behavior. */
  togglePinned(uri: FileUri): boolean {
    const index = this.tabs.findIndex((t) => t.uri === uri);
    if (index === -1) return false;
    const tab = this.tabs[index];
    tab.isPinned = !tab.isPinned;
    if (tab.isPinned) {
      tab.isPreview = false;
      this.tabs.splice(index, 1);
      const firstUnpinned = this.tabs.findIndex((t) => !t.isPinned);
      const insertAt = firstUnpinned === -1 ? this.tabs.length : firstUnpinned;
      this.tabs.splice(insertAt, 0, tab);
    }
    this.emitTabsChanged();
    return true;
  }

  // ─── Query ─────────────────────────────────────────────────────────────

  /**
   * Get all tabs in order.
   */
  getTabs(): ReadonlyArray<EditorTab> {
    return this.tabs;
  }

  /**
   * Get the active file URI.
   */
  getActiveUri(): FileUri | null {
    return this.activeUri;
  }

  /**
   * Get the active tab.
   */
  getActiveTab(): EditorTab | null {
    return this.tabs.find((t) => t.isActive) ?? null;
  }

  /**
   * Get active model info.
   */
  getActiveModelInfo(): EditorModelInfo | null {
    if (!this.activeUri) return null;
    return this.models.getModelInfo(this.activeUri) ?? null;
  }

  /**
   * Get cursor position for a file.
   */
  getCursorPosition(uri: FileUri): Position | null {
    return this.cursorPositions.get(uri) ?? null;
  }

  /**
   * Get the editor configuration.
   */
  getConfig(): Required<EditorConfig> {
    return this.config;
  }

  /**
   * Update editor configuration.
   */
  updateConfig(patch: Partial<EditorConfig>): void {
    Object.assign(this.config, patch);
    for (const listener of this.configListeners) {
      try {
        listener(this.config);
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Listen for editor configuration changes.
   */
  onConfigChanged(
    listener: (config: Required<EditorConfig>) => void,
  ): import("@webassembly-ide/shared").Disposable {
    this.configListeners.add(listener);
    return { dispose: () => this.configListeners.delete(listener) };
  }

  // ─── Cursor ────────────────────────────────────────────────────────────

  /**
   * Update cursor position for a file.
   */
  setCursorPosition(uri: FileUri, position: Position): void {
    this.cursorPositions.set(uri, position);
  }

  /**
   * Reveal a position in the active editor (used by Go to Line / Symbol).
   * Listeners (e.g. MonacoWrapper) are notified so they can scroll into view.
   */
  revealPosition(uri: FileUri, position: Position): void {
    this.setCursorPosition(uri, position);
    for (const listener of this.revealRequests) {
      try {
        listener(uri, position);
      } catch (err) {
        console.error("[EditorManager] revealPosition listener error:", err);
      }
    }
  }

  /**
   * Subscribe to revealPosition requests.
   */
  onRevealPosition(
    listener: (uri: FileUri, position: Position) => void,
  ): Disposable {
    this.revealRequests.add(listener);
    return { dispose: () => this.revealRequests.delete(listener) };
  }

  // ─── Listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for tab list changes.
   */
  onTabsChanged(listener: (tabs: EditorTab[]) => void): Disposable {
    this.tabListeners.add(listener);
    return { dispose: () => this.tabListeners.delete(listener) };
  }

  /**
   * Listen for active tab changes.
   */
  onActiveTabChanged(
    listener: (uri: FileUri | null, previousUri: FileUri | null) => void,
  ): Disposable {
    this.activeTabListeners.add(listener);
    return { dispose: () => this.activeTabListeners.delete(listener) };
  }

  // ─── Save ──────────────────────────────────────────────────────────────

  /**
   * Save the active file. Returns the URI if saved, null if nothing to save.
   * The actual file write is delegated to the File System Abstraction layer.
   */
  markSaved(uri: FileUri): boolean {
    const result = this.models.markSaved(uri);
    if (result) {
      this.setTabDirty(uri, false);
    }
    return result;
  }

  /**
   * Get all dirty URIs (files with unsaved changes).
   */
  getDirtyUris(): FileUri[] {
    return this.models.getDirtyUris();
  }

  /**
   * Check if there are any unsaved changes.
   */
  hasUnsavedChanges(): boolean {
    return this.models.hasDirtyModels();
  }

  // ─── Dispose ───────────────────────────────────────────────────────────

  dispose(): void {
    this.models.dispose();
    this.tabs = [];
    this.activeUri = null;
    this.cursorPositions.clear();
    this.tabListeners.clear();
    this.activeTabListeners.clear();
    this.revealRequests.clear();
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private emitTabsChanged(): void {
    const snapshot = [...this.tabs];
    for (const listener of this.tabListeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error("[EditorManager] Tab listener error:", err);
      }
    }
  }

  private emitActiveTabChanged(
    uri: FileUri | null,
    previousUri: FileUri | null,
  ): void {
    for (const listener of this.activeTabListeners) {
      try {
        listener(uri, previousUri);
      } catch (err) {
        console.error("[EditorManager] Active tab listener error:", err);
      }
    }
  }
}
