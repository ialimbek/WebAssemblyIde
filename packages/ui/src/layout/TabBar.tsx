import React from "react";

export interface TabBarItem {
  id: string;
  title: string;
  isActive?: boolean;
  isDirty?: boolean;
  isPinned?: boolean;
  color?: string;
}

export interface TabBarProps {
  tabs: readonly TabBarItem[];
  onActivate: (id: string) => void;
  onClose?: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onSplit?: (direction: "horizontal" | "vertical") => void;
}

export function TabBar({
  tabs,
  onActivate,
  onClose,
  onReorder,
  onSplit,
}: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Open editor tabs"
      style={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#1e1e1e",
        borderBottom: "1px solid #2d2d2d",
        minHeight: 35,
        overflowX: "auto",
      }}
    >
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={Boolean(tab.isActive)}
          tabIndex={tab.isActive ? 0 : -1}
          draggable={Boolean(onReorder)}
          onDragStart={(event) => {
            event.dataTransfer.setData("text/plain", String(index));
          }}
          onDragOver={(event) => {
            if (onReorder) event.preventDefault();
          }}
          onDrop={(event) => {
            if (!onReorder) return;
            event.preventDefault();
            const fromIndex = Number(event.dataTransfer.getData("text/plain"));
            if (!Number.isNaN(fromIndex)) onReorder(fromIndex, index);
          }}
          onClick={() => onActivate(tab.id)}
          style={{
            display: "flex",
            alignItems: "center",
            minWidth: 120,
            maxWidth: 220,
            padding: "0 8px",
            gap: 6,
            cursor: "pointer",
            color: tab.isActive ? "#ffffff" : "#969696",
            backgroundColor: tab.isActive ? "#1e1e1e" : "#2d2d2d",
            borderRight: "1px solid #2d2d2d",
            borderTop: tab.color
              ? `2px solid ${tab.color}`
              : "2px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          {tab.isDirty && (
            <span
              aria-label="Unsaved changes"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#e8a838",
                flexShrink: 0,
              }}
            />
          )}
          {tab.isPinned && <span aria-label="Pinned tab">●</span>}
          <span
            style={{ overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}
          >
            {tab.title}
          </span>
          {onClose && (
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.id);
              }}
              style={{
                border: 0,
                background: "transparent",
                color: "#969696",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {onSplit && tabs.length > 0 && (
        <div style={{ marginLeft: "auto", display: "flex" }}>
          <button
            type="button"
            title="Split editor right"
            onClick={() => onSplit("vertical")}
            style={splitButtonStyle}
          >
            ◫
          </button>
          <button
            type="button"
            title="Split editor down"
            onClick={() => onSplit("horizontal")}
            style={splitButtonStyle}
          >
            ⊟
          </button>
        </div>
      )}
    </div>
  );
}

const splitButtonStyle: React.CSSProperties = {
  border: 0,
  borderLeft: "1px solid #2d2d2d",
  background: "#252526",
  color: "#cccccc",
  padding: "0 10px",
  cursor: "pointer",
};
