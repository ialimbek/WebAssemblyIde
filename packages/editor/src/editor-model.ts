/**
 * Editor Model Manager — manages Monaco text models, dirty state, and file lifecycle.
 *
 * This module wraps Monaco's model layer and provides:
 * - Model creation and disposal
 * - Dirty state tracking
 * - File versioning for conflict detection
 * - Language detection from file extension
 */

import type { Disposable } from "@webassembly-ide/shared";
import type {
  FileUri,
  LanguageId,
  EditorModelInfo,
  EditorMarker,
} from "./types.js";

/** Map of file extensions to language IDs */
const LANGUAGE_MAP: Record<string, LanguageId> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  markdown: "markdown",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  svg: "xml",
  toml: "toml",
  ini: "ini",
  txt: "plaintext",
  log: "plaintext",
  dockerfile: "dockerfile",
  graphql: "graphql",
  gql: "graphql",
  lua: "lua",
  r: "r",
  dart: "dart",
  zig: "zig",
  vue: "html",
  svelte: "html",
  astro: "html",
};

/** Resolve language ID from file path */
export function resolveLanguageId(filePath: string): LanguageId {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return "plaintext";
  return LANGUAGE_MAP[ext] ?? "plaintext";
}

/** Extract file name from a URI/path */
export function extractFileName(uri: string): string {
  const parts = uri.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? uri;
}

/** Internal model entry */
interface ModelEntry {
  info: EditorModelInfo;
  content: string;
  listeners: Set<(info: EditorModelInfo) => void>;
  markerListeners: Set<(markers: EditorMarker[]) => void>;
  markers: EditorMarker[];
}

/**
 * EditorModelManager — lifecycle manager for editor file models.
 *
 * Tracks open files, their content, dirty state, and markers.
 * Does not directly depend on Monaco API types — operates on string content.
 * The Monaco wrapper layer connects Monaco models to this manager.
 */
export class EditorModelManager {
  private models = new Map<FileUri, ModelEntry>();
  private dirtyStateListeners = new Set<
    (uri: FileUri, isDirty: boolean) => void
  >();
  private modelEventListeners = new Set<
    (
      event: "opened" | "closed" | "saved" | "dirtyChanged" | "contentChanged",
      uri: FileUri,
    ) => void
  >();

  /**
   * Open a file model. If already open, activates it and returns existing info.
   */
  openFile(
    uri: FileUri,
    content: string,
    options?: {
      languageId?: LanguageId;
      isReadOnly?: boolean;
    },
  ): EditorModelInfo {
    const existing = this.models.get(uri);
    if (existing) {
      existing.info.modifiedAt = Date.now();
      return existing.info;
    }

    const now = Date.now();
    const info: EditorModelInfo = {
      uri,
      fileName: extractFileName(uri),
      languageId: options?.languageId ?? resolveLanguageId(uri),
      isDirty: false,
      isReadOnly: options?.isReadOnly ?? false,
      version: 1,
      createdAt: now,
      modifiedAt: now,
    };

    const entry: ModelEntry = {
      info,
      content,
      listeners: new Set(),
      markerListeners: new Set(),
      markers: [],
    };

    this.models.set(uri, entry);
    this.emitModelEvent("opened", uri);
    return info;
  }

  /**
   * Close a file model and dispose resources.
   */
  closeFile(uri: FileUri): boolean {
    const entry = this.models.get(uri);
    if (!entry) return false;

    this.models.delete(uri);
    entry.listeners.clear();
    entry.markerListeners.clear();
    this.emitModelEvent("closed", uri);
    return true;
  }

  /**
   * Get model info for a specific file.
   */
  getModelInfo(uri: FileUri): EditorModelInfo | undefined {
    return this.models.get(uri)?.info;
  }

  /**
   * Get content of a model.
   */
  getContent(uri: FileUri): string | undefined {
    return this.models.get(uri)?.content;
  }

  /**
   * Update content of a model and mark as dirty.
   * Returns false if model is read-only or not found.
   */
  updateContent(uri: FileUri, newContent: string): boolean {
    const entry = this.models.get(uri);
    if (!entry || entry.info.isReadOnly) return false;

    const wasDirty = entry.info.isDirty;
    entry.content = newContent;
    entry.info.version += 1;
    entry.info.modifiedAt = Date.now();

    if (!wasDirty) {
      entry.info.isDirty = true;
      this.emitDirtyStateChanged(uri, true);
    }

    this.notifyModelListeners(entry);
    return true;
  }

  /**
   * Replace content from an external source, optionally preserving dirty state.
   */
  replaceContent(
    uri: FileUri,
    newContent: string,
    options?: { markDirty?: boolean },
  ): boolean {
    const entry = this.models.get(uri);
    if (!entry || entry.info.isReadOnly) return false;

    const wasDirty = entry.info.isDirty;
    const shouldBeDirty = options?.markDirty ?? wasDirty;

    entry.content = newContent;
    entry.info.version += 1;
    entry.info.modifiedAt = Date.now();
    entry.info.isDirty = shouldBeDirty;

    if (wasDirty !== shouldBeDirty) {
      this.emitDirtyStateChanged(uri, shouldBeDirty);
    }

    this.emitModelEvent("contentChanged", uri);
    this.notifyModelListeners(entry);
    return true;
  }

  /**
   * Mark a model as saved (not dirty).
   */
  markSaved(uri: FileUri): boolean {
    const entry = this.models.get(uri);
    if (!entry) return false;

    entry.info.isDirty = false;
    entry.info.version += 1;
    entry.info.modifiedAt = Date.now();

    this.emitDirtyStateChanged(uri, false);
    this.emitModelEvent("saved", uri);
    this.notifyModelListeners(entry);
    return true;
  }

  /**
   * Set read-only state for a model.
   */
  setReadOnly(uri: FileUri, isReadOnly: boolean): boolean {
    const entry = this.models.get(uri);
    if (!entry) return false;

    entry.info.isReadOnly = isReadOnly;
    entry.info.modifiedAt = Date.now();
    this.notifyModelListeners(entry);
    return true;
  }

  /**
   * Set markers (diagnostics) for a model.
   */
  setMarkers(uri: FileUri, markers: EditorMarker[]): void {
    const entry = this.models.get(uri);
    if (!entry) return;

    entry.markers = markers;
    for (const listener of entry.markerListeners) {
      try {
        listener(markers);
      } catch (err) {
        console.error("[EditorModelManager] Marker listener error:", err);
      }
    }
  }

  /**
   * Get markers for a model.
   */
  getMarkers(uri: FileUri): EditorMarker[] {
    return this.models.get(uri)?.markers ?? [];
  }

  /**
   * Check if a model is open.
   */
  isOpen(uri: FileUri): boolean {
    return this.models.has(uri);
  }

  /**
   * Get all open model URIs.
   */
  getOpenUris(): FileUri[] {
    return Array.from(this.models.keys());
  }

  /**
   * Get all dirty model URIs.
   */
  getDirtyUris(): FileUri[] {
    return Array.from(this.models.entries())
      .filter(([, entry]) => entry.info.isDirty)
      .map(([uri]) => uri);
  }

  /**
   * Get count of open models.
   */
  getOpenCount(): number {
    return this.models.size;
  }

  /**
   * Check if any model has unsaved changes.
   */
  hasDirtyModels(): boolean {
    for (const entry of this.models.values()) {
      if (entry.info.isDirty) return true;
    }
    return false;
  }

  /**
   * Listen for model info changes on a specific file.
   */
  onModelChange(
    uri: FileUri,
    listener: (info: EditorModelInfo) => void,
  ): Disposable {
    const entry = this.models.get(uri);
    if (!entry) return { dispose: () => {} };

    entry.listeners.add(listener);
    return {
      dispose: () => {
        entry.listeners.delete(listener);
      },
    };
  }

  /**
   * Listen for marker changes on a specific file.
   */
  onMarkersChanged(
    uri: FileUri,
    listener: (markers: EditorMarker[]) => void,
  ): Disposable {
    const entry = this.models.get(uri);
    if (!entry) return { dispose: () => {} };

    entry.markerListeners.add(listener);
    return {
      dispose: () => {
        entry.markerListeners.delete(listener);
      },
    };
  }

  /**
   * Listen for dirty state changes on any file.
   */
  onDirtyStateChanged(
    listener: (uri: FileUri, isDirty: boolean) => void,
  ): Disposable {
    this.dirtyStateListeners.add(listener);
    return {
      dispose: () => {
        this.dirtyStateListeners.delete(listener);
      },
    };
  }

  /**
   * Listen for model lifecycle events (opened, closed, saved, dirtyChanged).
   */
  onModelEvent(
    listener: (
      event: "opened" | "closed" | "saved" | "dirtyChanged" | "contentChanged",
      uri: FileUri,
    ) => void,
  ): Disposable {
    this.modelEventListeners.add(listener);
    return {
      dispose: () => {
        this.modelEventListeners.delete(listener);
      },
    };
  }

  /**
   * Dispose all models and listeners.
   */
  dispose(): void {
    for (const uri of Array.from(this.models.keys())) {
      this.closeFile(uri);
    }
    this.dirtyStateListeners.clear();
    this.modelEventListeners.clear();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private notifyModelListeners(entry: ModelEntry): void {
    for (const listener of entry.listeners) {
      try {
        listener(entry.info);
      } catch (err) {
        console.error("[EditorModelManager] Model listener error:", err);
      }
    }
  }

  private emitDirtyStateChanged(uri: FileUri, isDirty: boolean): void {
    this.emitModelEvent("dirtyChanged", uri);
    for (const listener of this.dirtyStateListeners) {
      try {
        listener(uri, isDirty);
      } catch (err) {
        console.error("[EditorModelManager] Dirty state listener error:", err);
      }
    }
  }

  private emitModelEvent(
    event: "opened" | "closed" | "saved" | "dirtyChanged" | "contentChanged",
    uri: FileUri,
  ): void {
    for (const listener of this.modelEventListeners) {
      try {
        listener(event, uri);
      } catch (err) {
        console.error("[EditorModelManager] Event listener error:", err);
      }
    }
  }
}
