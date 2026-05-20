import React from "react";
/**
 * Status bar component at the bottom of the IDE
 */
export function StatusBar({ left, right }) {
    return (<div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            backgroundColor: "#007acc",
            color: "#ffffff",
            fontSize: "12px",
            padding: "0 8px",
        }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {left}
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {right}
      </div>
    </div>);
}
//# sourceMappingURL=StatusBar.js.map