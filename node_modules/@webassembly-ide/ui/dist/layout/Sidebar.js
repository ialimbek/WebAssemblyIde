import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Sidebar component for explorer, search, etc.
 */
export function Sidebar({ children, width = 240 }) {
    return (_jsx("div", { style: {
            width: `${width}px`,
            height: "100%",
            backgroundColor: "#252526",
            borderRight: "1px solid #333333",
            overflow: "auto",
        }, children: children }));
}
//# sourceMappingURL=Sidebar.js.map