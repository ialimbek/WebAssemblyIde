/** Startup phases that are safe to measure during shell-first boot. */
export type StartupPhaseId =
  | "app-shell"
  | "layout"
  | "workspace-selection"
  | "editor-minimal-loader"
  | "agent-placeholder"
  | "lazy-module";

/** Module allowed on the critical startup path. */
export interface CriticalStartupModule {
  id: string;
  description: string;
  phase: StartupPhaseId;
}

/** Heavy module that must be deferred until user intent requires it. */
export interface DeferredStartupModule {
  id: string;
  reason: string;
  loadTrigger: string;
}

/** Local-only startup measurement point. */
export interface StartupMeasurementPoint {
  id: string;
  label: string;
  targetMs?: number;
}

export const CRITICAL_STARTUP_PATH: readonly CriticalStartupModule[] = [
  {
    id: "application-shell",
    description:
      "Render the minimal IDE frame without workspace-heavy services.",
    phase: "app-shell",
  },
  {
    id: "layout-manager",
    description:
      "Hydrate basic layout state needed by sidebar, editor, bottom panel, and status bar.",
    phase: "layout",
  },
  {
    id: "command-palette-minimal-registry",
    description:
      "Register only shell-safe command metadata for early keyboard access.",
    phase: "layout",
  },
  {
    id: "workspace-selector",
    description:
      "Show recent workspace/open workspace affordances without scanning a repository.",
    phase: "workspace-selection",
  },
  {
    id: "monaco-minimal-loader",
    description:
      "Prepare the minimal editor loader without language workers or LSP clients.",
    phase: "editor-minimal-loader",
  },
  {
    id: "theme-keybinding-cache",
    description:
      "Read cached theme and keybinding metadata only; do not hydrate extensions.",
    phase: "layout",
  },
  {
    id: "agent-panel-placeholder",
    description:
      "Render a lightweight Agent panel placeholder without model connectors or tools.",
    phase: "agent-placeholder",
  },
] as const;

export const DEFERRED_STARTUP_MODULES: readonly DeferredStartupModule[] = [
  {
    id: "full-monaco-language-workers",
    reason:
      "Language workers are heavy and should start only when an editor model needs them.",
    loadTrigger: "first-file-open",
  },
  {
    id: "lsp-clients",
    reason:
      "LSP startup depends on workspace language detection and may spawn native processes.",
    loadTrigger: "workspace-language-detected",
  },
  {
    id: "wasm-parser-indexer-diff",
    reason:
      "Wasm services should stream/defer initialization after workspace selection.",
    loadTrigger: "workspace-background-indexing",
  },
  {
    id: "ai-provider-connectors",
    reason:
      "Provider metadata and token access must not run during shell boot.",
    loadTrigger: "agent-session-start",
  },
  {
    id: "terminal-pty-session-manager",
    reason:
      "Native PTY/process bridges are execution-layer services and require explicit user intent.",
    loadTrigger: "terminal-panel-open",
  },
  {
    id: "embedded-browser-bridge",
    reason:
      "Browser preview/introspection has a separate security boundary and should be panel lazy-loaded.",
    loadTrigger: "browser-panel-open",
  },
  {
    id: "scratchpad-runtime-templates",
    reason: "Scratchpad execution templates are not needed for first paint.",
    loadTrigger: "scratchpad-panel-open",
  },
  {
    id: "git-integrations",
    reason:
      "Git scanning should begin after workspace permission and tree hydration.",
    loadTrigger: "workspace-opened",
  },
  {
    id: "extension-compatibility-layer",
    reason: "Extensions must not affect startup time or shell stability.",
    loadTrigger: "extension-host-enabled",
  },
] as const;

export const STARTUP_MEASUREMENT_POINTS: readonly StartupMeasurementPoint[] = [
  {
    id: "app-shell-first-paint",
    label: "App shell first paint",
    targetMs: 1000,
  },
  {
    id: "interactive-startup",
    label: "Interactive startup time",
    targetMs: 1500,
  },
  {
    id: "workspace-tree-visible",
    label: "Workspace tree visible time",
    targetMs: 1200,
  },
  { id: "first-file-open", label: "First file open time", targetMs: 1500 },
  {
    id: "monaco-ready",
    label: "Monaco minimal loader ready time",
    targetMs: 1800,
  },
  {
    id: "agent-placeholder-ready",
    label: "Agent panel placeholder ready time",
    targetMs: 1200,
  },
] as const;

/**
 * Guards the shell-first startup path from accidentally loading deferred services.
 * This is intentionally synchronous and dependency-free so it can run during boot.
 */
export function assertCriticalStartupModule(moduleId: string): void {
  const isCritical = CRITICAL_STARTUP_PATH.some(
    (module) => module.id === moduleId,
  );
  const isDeferred = DEFERRED_STARTUP_MODULES.some(
    (module) => module.id === moduleId,
  );

  if (!isCritical || isDeferred) {
    throw new Error(
      `Module "${moduleId}" is not allowed on the critical startup path. Register it as a lazy module instead.`,
    );
  }
}
