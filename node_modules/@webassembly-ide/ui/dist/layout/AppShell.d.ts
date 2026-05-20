import React from "react";
export interface AppShellProps {
    sidebar: React.ReactNode;
    editor: React.ReactNode;
    bottomPanel?: React.ReactNode;
    statusBar: React.ReactNode;
}
/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) | status bar
 */
export declare function AppShell({ sidebar, editor, bottomPanel, statusBar, }: AppShellProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AppShell.d.ts.map