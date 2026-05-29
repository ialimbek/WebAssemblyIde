import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) [+ optional right panel] | status bar
 */
export function AppShell({ menuBar, activityBar, sidebar, editor, bottomPanel, rightPanel, statusBar, sidebarCollapsed = false, bottomPanelCollapsed = false, rightPanelCollapsed = false, activityBarCollapsed = false, onToggleSidebar, onToggleBottomPanel, onToggleRightPanel, onToggleActivityBar, }) {
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
    const [rightPanelWidth, setRightPanelWidth] = useState(300);
    const isResizing = useRef(null);
    const resizeStartPos = useRef(0);
    const resizeStartValue = useRef(0);
    useEffect(() => {
        const onMove = (e) => {
            if (!isResizing.current)
                return;
            if (isResizing.current === "sidebar") {
                const delta = e.clientX - resizeStartPos.current;
                const w = Math.max(180, Math.min(600, resizeStartValue.current + delta));
                setSidebarWidth(w);
            }
            else if (isResizing.current === "right") {
                const delta = resizeStartPos.current - e.clientX;
                const w = Math.max(200, Math.min(600, resizeStartValue.current + delta));
                setRightPanelWidth(w);
            }
            else if (isResizing.current === "bottom") {
                const delta = resizeStartPos.current - e.clientY;
                const h = Math.max(100, Math.min(500, resizeStartValue.current + delta));
                setBottomPanelHeight(h);
            }
        };
        const onUp = () => {
            if (!isResizing.current)
                return;
            isResizing.current = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, []);
    const startResizeSidebar = useCallback((e) => {
        isResizing.current = "sidebar";
        resizeStartPos.current = e.clientX;
        resizeStartValue.current = sidebarWidth;
        e.preventDefault();
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, [sidebarWidth]);
    const startResizeRight = useCallback((e) => {
        isResizing.current = "right";
        resizeStartPos.current = e.clientX;
        resizeStartValue.current = rightPanelWidth;
        e.preventDefault();
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, [rightPanelWidth]);
    const startResizeBottom = useCallback((e) => {
        isResizing.current = "bottom";
        resizeStartPos.current = e.clientY;
        resizeStartValue.current = bottomPanelHeight;
        e.preventDefault();
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
    }, [bottomPanelHeight]);
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            backgroundColor: "var(--editor-background, #1e1e1e)",
            color: "var(--editor-foreground, #cccccc)",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "13px",
        }, children: [menuBar, _jsxs("div", { style: {
                    display: "flex",
                    flex: 1,
                    overflow: "hidden",
                }, children: [!activityBarCollapsed && activityBar && (_jsx("div", { style: {
                            width: "48px",
                            borderRight: "1px solid var(--sideBar-border, #333333)",
                            backgroundColor: "var(--activityBar-background, #333333)",
                            overflow: "hidden",
                        }, children: activityBar })), !sidebarCollapsed && (_jsxs("div", { style: {
                            width: `${sidebarWidth}px`,
                            minWidth: `${sidebarWidth}px`,
                            maxWidth: "600px",
                            borderRight: "1px solid var(--sideBar-border, #333333)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                        }, children: [sidebar, _jsx("div", { onMouseDown: startResizeSidebar, style: {
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    cursor: "col-resize",
                                    zIndex: 10,
                                    background: "transparent",
                                } })] })), _jsxs("div", { style: {
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
                                            position: "relative",
                                        }, children: editor }), rightPanel && !rightPanelCollapsed && (_jsxs("div", { style: {
                                            width: `${rightPanelWidth}px`,
                                            minWidth: `${rightPanelWidth}px`,
                                            maxWidth: "600px",
                                            borderLeft: "1px solid var(--sideBar-border, #333333)",
                                            overflow: "hidden",
                                            display: "flex",
                                            flexDirection: "column",
                                            position: "relative",
                                        }, children: [rightPanel, _jsx("div", { onMouseDown: startResizeRight, style: {
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: 4,
                                                    cursor: "col-resize",
                                                    zIndex: 10,
                                                    background: "transparent",
                                                } })] }))] }), bottomPanel && !bottomPanelCollapsed && (_jsxs("div", { style: {
                                    height: `${bottomPanelHeight}px`,
                                    minHeight: `${bottomPanelHeight}px`,
                                    maxHeight: "500px",
                                    borderTop: "1px solid var(--sideBar-border, #333333)",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                }, children: [bottomPanel, _jsx("div", { onMouseDown: startResizeBottom, style: {
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            height: 4,
                                            cursor: "row-resize",
                                            zIndex: 10,
                                            background: "transparent",
                                        } })] }))] })] }), _jsxs("div", { style: {
                    height: "24px",
                    borderTop: "1px solid var(--sideBar-border, #333333)",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "var(--statusBar-background, #007acc)",
                    color: "var(--statusBar-foreground, #ffffff)",
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
            color: "var(--statusBar-foreground, #ffffff)",
            cursor: "pointer",
            fontSize: 11,
        }, children: label }));
}
//# sourceMappingURL=AppShell.js.map