import React from "react";

export interface BottomPanelProps {
  children: React.ReactNode;
  height?: number;
  tabs?: Array<{
    id: string;
    label: string;
    active?: boolean;
    onClick?: () => void;
  }>;
}

/**
 * Bottom panel component for terminal, problems, output, etc.
 */
export function BottomPanel({
  children,
  height = 200,
  tabs,
}: BottomPanelProps) {
  return (
    <div
      style={{
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
        borderTop: "1px solid #333333",
      }}
    >
      {/* Tab bar */}
      {tabs && tabs.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid #333333",
            backgroundColor: "#252526",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={tab.onClick}
              style={{
                background: tab.active ? "#1e1e1e" : "transparent",
                border: "none",
                borderBottom: tab.active
                  ? "1px solid #007acc"
                  : "1px solid transparent",
                color: tab.active ? "#ffffff" : "#999999",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "4px 8px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
