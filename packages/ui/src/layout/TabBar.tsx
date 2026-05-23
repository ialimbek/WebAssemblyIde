import React, { useEffect, useRef, useState } from "react";

export interface TabBarItem {
  id: string;
  title: string;
  isActive?: boolean;
  isDirty?: boolean;
  isPinned?: boolean;
  color?: string;
}

export interface TabBarContextMenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface TabBarProps {
  tabs: readonly TabBarItem[];
  onActivate: (id: string) => void;
  onClose?: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onSplit?: (direction: "horizontal" | "vertical") => void;
  /**
   * Build a context menu for a specific tab. Return an empty array to disable.
   */
  buildContextMenu?: (tabId: string) => TabBarContextMenuItem[];
  /** Toggle the pinned state for a tab. */
  onTogglePinned?: (tabId: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: TabBarContextMenuItem[];
}

export function TabBar({
  tabs,
  onActivate,
  onClose,
  onReorder,
  onSplit,
  buildContextMenu,
  onTogglePinned,
}: TabBarProps) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenu(null);
      }
    };
    const closeOnEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", closeOnEsc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeOnEsc);
    };
  }, [menu]);

  const defaultMenu = (tabId: string): TabBarContextMenuItem[] => {
    if (!onClose) return [];
    return [
      { label: "Close", onSelect: () => onClose(tabId) },
      {
        label: "Close Others",
        onSelect: () => {
          for (const t of tabs) {
            if (t.id !== tabId) onClose(t.id);
          }
        },
        disabled: tabs.length <= 1,
      },
      {
        label: "Close All",
        onSelect: () => {
          for (const t of tabs) onClose(t.id);
        },
      },
      ...(onTogglePinned
        ? [
            {
              label: tabs.find((t) => t.id === tabId)?.isPinned
                ? "Unpin"
                : "Pin",
              onSelect: () => onTogglePinned(tabId),
            },
          ]
        : []),
    ];
  };

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
          onAuxClick={(event) => {
            if (event.button === 1 && onClose) {
              event.preventDefault();
              onClose(tab.id);
            }
          }}
          onContextMenu={(event) => {
            const items = buildContextMenu
              ? buildContextMenu(tab.id)
              : defaultMenu(tab.id);
            if (items.length === 0) return;
            event.preventDefault();
            setMenu({ x: event.clientX, y: event.clientY, items });
          }}
          onDoubleClick={() => onTogglePinned?.(tab.id)}
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
                fontSize: 14,
                fontWeight: "bold",
                color: "#e8a838",
                flexShrink: 0,
              }}
            >
              *
            </span>
          )}
          {tab.isPinned && (
            <span
              aria-label="Pinned tab"
              title="Pinned"
              style={{ fontSize: 10 }}
            >
              ●
            </span>
          )}
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

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Tab actions"
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            zIndex: 10001,
            minWidth: 160,
            background: "var(--dropdown-background, #252526)",
            border: "1px solid rgba(128,128,128,0.3)",
            borderRadius: 4,
            boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            padding: "4px 0",
          }}
        >
          {menu.items.map((item, idx) => (
            <button
              key={`${item.label}-${idx}`}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setMenu(null);
              }}
              style={{
                background: "transparent",
                border: 0,
                color: item.danger ? "#f44747" : "#cccccc",
                textAlign: "left",
                padding: "6px 12px",
                cursor: item.disabled ? "default" : "pointer",
                fontSize: 12,
                opacity: item.disabled ? 0.4 : 1,
              }}
              onMouseEnter={(event) => {
                if (item.disabled) return;
                (event.currentTarget as HTMLElement).style.background =
                  "var(--list-activeSelectionBackground, #094771)";
              }}
              onMouseLeave={(event) => {
                (event.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              {item.label}
            </button>
          ))}
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
