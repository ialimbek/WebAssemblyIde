import React from "react";
/**
 * Sidebar component for explorer, search, etc.
 */
export function Sidebar({ children, width = 240 }) {
    return (<div style={{
            width: `${width}px`,
            height: "100%",
            backgroundColor: "#252526",
            borderRight: "1px solid #333333",
            overflow: "auto",
        }}>
      {children}
    </div>);
}
//# sourceMappingURL=Sidebar.js.map