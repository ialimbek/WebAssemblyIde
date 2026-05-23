import React from "react";

export interface AppShellProps {
  menuBar?: React.ReactNode;
  activityBar?: React.ReactNode;
  sidebar: React.ReactNode;
  editor: React.ReactNode;
  bottomPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  statusBar: React.ReactNode;
  sidebarCollapsed?: boolean;
  bottomPanelCollapsed?: boolean;
  rightPanelCollapsed?: boolean;
  activityBarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onToggleBottomPanel?: () => void;
  onToggleRightPanel?: () => void;
  onToggleActivityBar?: () => void;
}

/**
 * Main application shell layout
 * Structure: sidebar | editor area (+ optional bottom panel) [+ optional right panel] | status bar
 */
export function AppShell({
  menuBar,
  activityBar,
  sidebar,
  editor,
  bottomPanel,
  rightPanel,
  statusBar,
  sidebarCollapsed = false,
  bottomPanelCollapsed = false,
  rightPanelCollapsed = false,
  activityBarCollapsed = false,
  onToggleSidebar,
  onToggleBottomPanel,
  onToggleRightPanel,
  onToggleActivityBar,
}: AppShellProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#1e1e1e",
        color: "#cccccc",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "13px",
      }}
    >
      {menuBar}
      {/* Main content area */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {!activityBarCollapsed && activityBar && (
          <div
            style={{
              width: "48px",
              borderRight: "1px solid #333333",
              backgroundColor: "#333333",
              overflow: "hidden",
            }}
          >
            {activityBar}
          </div>
        )}
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div
            style={{
              width: "240px",
              minWidth: "180px",
              borderRight: "1px solid #333333",
              overflow: "auto",
              resize: "horizontal",
            }}
          >
            {sidebar}
          </div>
        )}

        {/* Editor + Bottom Panel area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Editor area with optional right panel */}
          <div
            style={{
              flex: 1,
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* Editor area */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
              }}
            >
              {editor}
            </div>

            {/* Right panel (optional) */}
            {rightPanel && !rightPanelCollapsed && (
              <div
                style={{
                  width: "300px",
                  minWidth: "240px",
                  borderLeft: "1px solid #333333",
                  overflow: "auto",
                }}
              >
                {rightPanel}
              </div>
            )}
          </div>

          {/* Bottom panel (optional) */}
          {bottomPanel && !bottomPanelCollapsed && (
            <div
              style={{
                height: "200px",
                borderTop: "1px solid #333333",
                overflow: "auto",
              }}
            >
              {bottomPanel}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          height: "24px",
          borderTop: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#007acc",
          color: "#ffffff",
          fontSize: "12px",
        }}
      >
        <ShellToggleButton
          label={activityBarCollapsed ? "▸ Act" : "◂ Act"}
          active={!activityBarCollapsed}
          onClick={onToggleActivityBar}
        />
        <ShellToggleButton
          label={sidebarCollapsed ? "▸ Explorer" : "◂ Explorer"}
          active={!sidebarCollapsed}
          onClick={onToggleSidebar}
        />
        <ShellToggleButton
          label={bottomPanelCollapsed ? "▴ Terminal" : "▾ Terminal"}
          active={!bottomPanelCollapsed}
          onClick={onToggleBottomPanel}
        />
        <ShellToggleButton
          label={rightPanelCollapsed ? "◂ Agent" : "▸ Agent"}
          active={!rightPanelCollapsed}
          onClick={onToggleRightPanel}
        />
        <div style={{ flex: 1 }}>{statusBar}</div>
      </div>
    </div>
  );
}

function ShellToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Toggle ${label}`}
      onClick={onClick}
      style={{
        height: "100%",
        padding: "0 8px",
        border: 0,
        borderRight: "1px solid rgba(255,255,255,0.2)",
        background: active ? "rgba(255,255,255,0.14)" : "transparent",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: 11,
      }}
    >
      {label}
    </button>
  );
}
