import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Status bar component at the bottom of the IDE
 */
export function StatusBar({ left, right }) {
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--statusBar-background, #007acc)",
            color: "var(--statusBar-foreground, #ffffff)",
            fontSize: "12px",
            padding: "0 8px",
        }, children: [_jsx("div", { style: { display: "flex", gap: "12px", alignItems: "center" }, children: left }), _jsx("div", { style: { display: "flex", gap: "12px", alignItems: "center" }, children: right })] }));
}
//# sourceMappingURL=StatusBar.js.map