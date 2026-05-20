import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Generic panel component with title bar
 */
export function Panel({ title, children, onClose, actions }) {
    return (_jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: "#252526",
        }, children: [_jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    backgroundColor: "#2d2d2d",
                    borderBottom: "1px solid #333333",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                }, children: [_jsx("span", { children: title }), _jsxs("div", { style: { display: "flex", gap: "4px", alignItems: "center" }, children: [actions, onClose && (_jsx("button", { onClick: onClose, style: {
                                    background: "none",
                                    border: "none",
                                    color: "#999999",
                                    cursor: "pointer",
                                    padding: "2px 4px",
                                    fontSize: "14px",
                                }, children: "\u00D7" }))] })] }), _jsx("div", { style: {
                    flex: 1,
                    overflow: "auto",
                    padding: "8px",
                }, children: children })] }));
}
//# sourceMappingURL=Panel.js.map