import React from "react";
/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) | status bar
 */
export function AppShell({ sidebar, editor, bottomPanel, statusBar, }) {
    return (<div style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            backgroundColor: "#1e1e1e",
            color: "#cccccc",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "13px",
        }}>
      {/* Main content area */}
      <div style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
        }}>
        {/* Sidebar */}
        <div style={{
            width: "240px",
            minWidth: "180px",
            borderRight: "1px solid #333333",
            overflow: "auto",
        }}>
          {sidebar}
        </div>

        {/* Editor + Bottom Panel area */}
        <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        }}>
          {/* Editor area */}
          <div style={{
            flex: 1,
            overflow: "hidden",
        }}>
            {editor}
          </div>

          {/* Bottom panel (optional) */}
          {bottomPanel && (<div style={{
                height: "200px",
                borderTop: "1px solid #333333",
                overflow: "auto",
            }}>
              {bottomPanel}
            </div>)}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
            height: "24px",
            borderTop: "1px solid #333333",
            display: "flex",
            alignItems: "center",
        }}>
        {statusBar}
      </div>
    </div>);
}
//# sourceMappingURL=AppShell.js.map