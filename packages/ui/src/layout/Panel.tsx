import React from "react";

export interface PanelProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  actions?: React.ReactNode;
}

/**
 * Generic panel component with title bar
 */
export function Panel({ title, children, onClose, actions }: PanelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#252526",
      }}
    >
      {/* Panel title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          backgroundColor: "#2d2d2d",
          borderBottom: "1px solid #333333",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        <span>{title}</span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {actions}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#999999",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: "14px",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Panel content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
