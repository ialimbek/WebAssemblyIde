import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) | status bar
 */
export function AppShell({ sidebar, editor, bottomPanel, statusBar, }) {
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
        }, children: [_jsxs("div", { style: {
                    display: "flex",
                    flex: 1,
                    overflow: "hidden",
                }, children: [_jsx("div", { style: {
                            width: "240px",
                            minWidth: "180px",
                            borderRight: "1px solid #333333",
                            overflow: "auto",
                        }, children: sidebar }), _jsxs("div", { style: {
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                        }, children: [_jsx("div", { style: {
                                    flex: 1,
                                    overflow: "hidden",
                                }, children: editor }), bottomPanel && (_jsx("div", { style: {
                                    height: "200px",
                                    borderTop: "1px solid #333333",
                                    overflow: "auto",
                                }, children: bottomPanel }))] })] }), _jsx("div", { style: {
                    height: "24px",
                    borderTop: "1px solid #333333",
                    display: "flex",
                    alignItems: "center",
                }, children: statusBar })] }));
}
//# sourceMappingURL=AppShell.js.map