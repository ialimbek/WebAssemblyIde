/**
 * @webassembly-ide/ui
 *
 * Shared UI components for WebAssemblyIde.
 * Provides skeleton components for the IDE shell.
 */

// ─── Layout Components ──────────────────────────────────────────────────────
export { AppShell, type AppShellProps } from "./layout/AppShell.js";
export { Panel, type PanelProps } from "./layout/Panel.js";
export { Sidebar, type SidebarProps } from "./layout/Sidebar.js";
export { StatusBar, type StatusBarProps } from "./layout/StatusBar.js";
export { BottomPanel, type BottomPanelProps } from "./layout/BottomPanel.js";

// ─── Common Components ──────────────────────────────────────────────────────
export { Button, type ButtonProps } from "./common/Button.js";
export {
  ErrorBoundary,
  type ErrorBoundaryProps,
} from "./common/ErrorBoundary.js";
