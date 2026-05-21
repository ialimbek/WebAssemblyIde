/**
 * Editor Types — core type definitions for the Monaco editor integration.
 */

/** URI string identifying a file model */
export type FileUri = string;

/** Language identifier (e.g., "typescript", "javascript", "rust") */
export type LanguageId = string;

/** Position within a text document */
export interface Position {
  line: number;
  column: number;
}

/** Range within a text document */
export interface Range {
  start: Position;
  end: Position;
}

/** Marker severity levels matching Monaco */
export type MarkerSeverity = "error" | "warning" | "info" | "hint";

/** Diagnostic marker for an editor model */
export interface EditorMarker {
  range: Range;
  message: string;
  severity: MarkerSeverity;
  source?: string;
  code?: string | number;
}

/** Editor model metadata */
export interface EditorModelInfo {
  uri: FileUri;
  fileName: string;
  languageId: LanguageId;
  isDirty: boolean;
  isReadOnly: boolean;
  /** Last known version/content hash for conflict detection */
  version: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
}

/** Tab state for multi-tab management */
export interface EditorTab {
  uri: FileUri;
  title: string;
  isDirty: boolean;
  isActive: boolean;
  /** Preview tabs are replaced when another file is opened */
  isPreview: boolean;
}

/** Editor configuration */
export interface EditorConfig {
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Tab size in spaces */
  tabSize?: number;
  /** Insert spaces instead of tabs */
  insertSpaces?: boolean;
  /** Word wrap mode */
  wordWrap?: "off" | "on" | "wordWrapColumn" | "bounded";
  /** Show minimap */
  minimap?: boolean;
  /** Line numbers display */
  lineNumbers?: "on" | "off" | "relative" | "interval";
  /** Render whitespace */
  renderWhitespace?: "none" | "boundary" | "selection" | "trailing" | "all";
  /** Theme name */
  theme?: string;
  /** Auto save delay in ms (0 = manual only) */
  autoSaveDelay?: number;
  /** Large file threshold in bytes */
  largeFileThreshold?: number;
}

/** Default editor configuration */
export const DEFAULT_EDITOR_CONFIG: Required<EditorConfig> = {
  fontSize: 14,
  fontFamily:
    "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
  tabSize: 2,
  insertSpaces: true,
  wordWrap: "off",
  minimap: true,
  lineNumbers: "on",
  renderWhitespace: "selection",
  theme: "vs-dark",
  autoSaveDelay: 1000,
  largeFileThreshold: 5 * 1024 * 1024, // 5MB
};

/** Editor events */
export interface EditorEventMap {
  "editor:modelOpened": { uri: FileUri; languageId: LanguageId };
  "editor:modelClosed": { uri: FileUri };
  "editor:modelDirtyChanged": { uri: FileUri; isDirty: boolean };
  "editor:modelSaved": { uri: FileUri };
  "editor:modelContentChanged": { uri: FileUri; changes: number };
  "editor:activeTabChanged": {
    uri: FileUri | null;
    previousUri: FileUri | null;
  };
  "editor:tabClosed": { uri: FileUri };
  "editor:cursorPositionChanged": { uri: FileUri; position: Position };
  "editor:markersChanged": { uri: FileUri; markers: EditorMarker[] };
}
