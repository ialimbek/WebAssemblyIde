import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) [+ optional right panel] | status bar
 */
export function AppShell({ menuBar, activityBar, sidebar, editor, bottomPanel, rightPanel, statusBar, sidebarCollapsed = false, bottomPanelCollapsed = false, rightPanelCollapsed = false, activityBarCollapsed = false, onToggleSidebar, onToggleBottomPanel, onToggleRightPanel, onToggleActivityBar, }) {
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            backgroundColor: "#1e1e1e",
            color: "#cccccc",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "13px",
        }, children: [menuBar, _jsxs("div", { style: {
                    display: "flex",
                    flex: 1,
                    overflow: "hidden",
                }, children: [!activityBarCollapsed && activityBar && (_jsx("div", { style: {
                            width: "48px",
                            borderRight: "1px solid #333333",
                            backgroundColor: "#333333",
                            overflow: "hidden",
                        }, children: activityBar })), !sidebarCollapsed && (_jsx("div", { style: {
                            width: "240px",
                            minWidth: "180px",
                            borderRight: "1px solid #333333",
                            overflow: "auto",
                            resize: "horizontal",
                        }, children: sidebar })), _jsxs("div", { style: {
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }, children: [_jsxs("div", { style: {
                                    flex: 1,
                                    display: "flex",
                                    overflow: "hidden",
                                }, children: [_jsx("div", { style: {
                                            flex: 1,
                                            overflow: "hidden",
                                        }, children: editor }), rightPanel && !rightPanelCollapsed && (_jsx("div", { style: {
                                            width: "300px",
                                            minWidth: "240px",
                                            borderLeft: "1px solid #333333",
                                            overflow: "auto",
                                        }, children: rightPanel }))] }), bottomPanel && !bottomPanelCollapsed && (_jsx("div", { style: {
                                    height: "200px",
                                    borderTop: "1px solid #333333",
                                    overflow: "auto",
                                }, children: bottomPanel }))] })] }), _jsxs("div", { style: {
                    height: "24px",
                    borderTop: "1px solid #333333",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#007acc",
                    color: "#ffffff",
                    fontSize: "12px",
                }, children: [_jsx(ShellToggleButton, { label: activityBarCollapsed ? "▸ Act" : "◂ Act", active: !activityBarCollapsed, onClick: onToggleActivityBar }), _jsx(ShellToggleButton, { label: sidebarCollapsed ? "▸ Explorer" : "◂ Explorer", active: !sidebarCollapsed, onClick: onToggleSidebar }), _jsx(ShellToggleButton, { label: bottomPanelCollapsed ? "▴ Terminal" : "▾ Terminal", active: !bottomPanelCollapsed, onClick: onToggleBottomPanel }), _jsx(ShellToggleButton, { label: rightPanelCollapsed ? "◂ Agent" : "▸ Agent", active: !rightPanelCollapsed, onClick: onToggleRightPanel }), _jsx("div", { style: { flex: 1 }, children: statusBar })] })] }));
}
function ShellToggleButton({ label, active, onClick, }) {
    if (!onClick)
        return null;
    return (_jsx("button", { type: "button", "aria-pressed": active, "aria-label": `Toggle ${label}`, onClick: onClick, style: {
            height: "100%",
            padding: "0 8px",
            border: 0,
            borderRight: "1px solid rgba(255,255,255,0.2)",
            background: active ? "rgba(255,255,255,0.14)" : "transparent",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: 11,
        }, children: label }));
}
//# sourceMappingURL=AppShell.js.map