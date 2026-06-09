/**
 * @webassembly-ide/editor
 *
 * Monaco Editor integration for Codembly.
 * Provides editor model management, tab management, and the Monaco wrapper component.
 */

// ─── Types ──────────────────────────────────────────────────────────────
export type {
  FileUri,
  LanguageId,
  Position,
  Range,
  MarkerSeverity,
  EditorMarker,
  EditorModelInfo,
  EditorTab,
  EditorConfig,
  EditorEventMap,
} from "./types.js";

export { DEFAULT_EDITOR_CONFIG } from "./types.js";

// ─── Model Manager ──────────────────────────────────────────────────────
export {
  EditorModelManager,
  resolveLanguageId,
  extractFileName,
} from "./editor-model.js";

// ─── Editor Manager ─────────────────────────────────────────────────────
export { EditorManager } from "./editor-manager.js";

// ─── Monaco Wrapper (React component) ───────────────────────────────────
export { MonacoWrapper, type MonacoWrapperProps } from "./monaco-wrapper.js";

// ─── Diff Editor (React component) ─────────────────────────────────────
export { DiffEditor } from "./diff-editor.js";

// ─── Monaco Theme Adapter ───────────────────────────────────────────────
export { defineMonacoTheme, toMonacoThemeData } from "./monaco-theme-adapter.js";

// ─── Monaco Language Bootstrap ──────────────────────────────────────────
export {
  loadMonacoLanguage,
  loadMonacoLanguageContributions,
  loadMonacoLanguageForFile,
} from "./monaco-languages.js";
