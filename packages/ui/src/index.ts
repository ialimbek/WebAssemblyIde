/**
 * @webassembly-ide/ui
 *
 * Shared UI components for WebAssemblyIde.
 * Provides skeleton components for the IDE shell.
 */

// ─── Layout Components ──────────────────────────────────────────────────────
export { AppShell, type AppShellProps } from "./layout/AppShell.js";
export {
  MenuBar,
  type MenuBarProps,
  type MenuDefinition,
  type MenuItemDefinition,
  type MenuItemKind,
} from "./layout/MenuBar.js";
export { TabBar, type TabBarProps, type TabBarItem } from "./layout/TabBar.js";
export { Panel, type PanelProps } from "./layout/Panel.js";
export { Sidebar, type SidebarProps } from "./layout/Sidebar.js";
export { StatusBar, type StatusBarProps } from "./layout/StatusBar.js";
export { BottomPanel, type BottomPanelProps } from "./layout/BottomPanel.js";
export {
  TitleBar,
  type TitleBarProps,
  type TitleBarControls,
} from "./layout/TitleBar.js";

// ─── Common Components ──────────────────────────────────────────────────────
export { Button, type ButtonProps } from "./common/Button.js";
export {
  ErrorBoundary,
  type ErrorBoundaryProps,
} from "./common/ErrorBoundary.js";
