import React, { useState, useRef, useEffect, useCallback } from "react";

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
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);

  const isResizing = useRef<"sidebar" | "bottom" | "right" | null>(null);
  const resizeStartPos = useRef(0);
  const resizeStartValue = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      if (isResizing.current === "sidebar") {
        const delta = e.clientX - resizeStartPos.current;
        const w = Math.max(180, Math.min(600, resizeStartValue.current + delta));
        setSidebarWidth(w);
      } else if (isResizing.current === "right") {
        const delta = resizeStartPos.current - e.clientX;
        const w = Math.max(200, Math.min(600, resizeStartValue.current + delta));
        setRightPanelWidth(w);
      } else if (isResizing.current === "bottom") {
        const delta = resizeStartPos.current - e.clientY;
        const h = Math.max(100, Math.min(500, resizeStartValue.current + delta));
        setBottomPanelHeight(h);
      }
    };
    const onUp = () => {
      if (!isResizing.current) return;
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

  const startResizeSidebar = useCallback((e: React.MouseEvent) => {
    isResizing.current = "sidebar";
    resizeStartPos.current = e.clientX;
    resizeStartValue.current = sidebarWidth;
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  const startResizeRight = useCallback((e: React.MouseEvent) => {
    isResizing.current = "right";
    resizeStartPos.current = e.clientX;
    resizeStartValue.current = rightPanelWidth;
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [rightPanelWidth]);

  const startResizeBottom = useCallback((e: React.MouseEvent) => {
    isResizing.current = "bottom";
    resizeStartPos.current = e.clientY;
    resizeStartValue.current = bottomPanelHeight;
    e.preventDefault();
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, [bottomPanelHeight]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--editor-background, #1e1e1e)",
        color: "var(--editor-foreground, #cccccc)",
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
              borderRight: "1px solid var(--sideBar-border, #333333)",
              backgroundColor: "var(--activityBar-background, #333333)",
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
              width: `${sidebarWidth}px`,
              minWidth: `${sidebarWidth}px`,
              maxWidth: "600px",
              borderRight: "1px solid var(--sideBar-border, #333333)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {sidebar}
            <div
              onMouseDown={startResizeSidebar}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: "col-resize",
                zIndex: 10,
                background: "transparent",
              }}
            />
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
                position: "relative",
              }}
            >
              {editor}
            </div>

            {/* Right panel (optional) */}
            {rightPanel && !rightPanelCollapsed && (
              <div
                style={{
                  width: `${rightPanelWidth}px`,
                  minWidth: `${rightPanelWidth}px`,
                  maxWidth: "600px",
                  borderLeft: "1px solid var(--sideBar-border, #333333)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {rightPanel}
                <div
                  onMouseDown={startResizeRight}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    cursor: "col-resize",
                    zIndex: 10,
                    background: "transparent",
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom panel (optional) */}
          {bottomPanel && !bottomPanelCollapsed && (
            <div
              style={{
                height: `${bottomPanelHeight}px`,
                minHeight: `${bottomPanelHeight}px`,
                maxHeight: "500px",
                borderTop: "1px solid var(--sideBar-border, #333333)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {bottomPanel}
              <div
                onMouseDown={startResizeBottom}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 4,
                  cursor: "row-resize",
                  zIndex: 10,
                  background: "transparent",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div
        style={{
          height: "24px",
          borderTop: "1px solid var(--sideBar-border, #333333)",
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--statusBar-background, #007acc)",
          color: "var(--statusBar-foreground, #ffffff)",
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
        color: "var(--statusBar-foreground, #ffffff)",
        cursor: "pointer",
        fontSize: 11,
      }}
    >
      {label}
    </button>
  );
}
