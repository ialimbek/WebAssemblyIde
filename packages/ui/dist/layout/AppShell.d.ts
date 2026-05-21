import React from "react";
export interface AppShellProps {
    menuBar?: React.ReactNode;
    activityBar?: React.ReactNode;
    sidebar: React.ReactNode;
    editor: React.ReactNode;
    bottomPanel?: React.ReactNode;
    rightPanel?: React.ReactNode;
    statusBar: React.ReactNode;
    sidebarCollapsed?: boolean;
    bottomPanelCollapsed?: boolean;
    rightPanelCollapsed?: boolean;
    activityBarCollapsed?: boolean;
    onToggleSidebar?: () => void;
    onToggleBottomPanel?: () => void;
    onToggleRightPanel?: () => void;
    onToggleActivityBar?: () => void;
}
/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) [+ optional right panel] | status bar
 */
export declare function AppShell({ menuBar, activityBar, sidebar, editor, bottomPanel, rightPanel, statusBar, sidebarCollapsed, bottomPanelCollapsed, rightPanelCollapsed, activityBarCollapsed, onToggleSidebar, onToggleBottomPanel, onToggleRightPanel, onToggleActivityBar, }: AppShellProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AppShell.d.ts.map