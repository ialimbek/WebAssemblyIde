import React, { useCallback, useEffect, useRef, useState } from "react";

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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const tabListRef = useRef<HTMLDivElement | null>(null);

  // Inject scrollbar CSS styles on mount
  useEffect(() => {
    const styleId = "tab-bar-scroll-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .tab-bar-scroll-container::-webkit-scrollbar {
        height: 6px;
      }
      .tab-bar-scroll-container::-webkit-scrollbar-track {
        background: #1e1e1e;
      }
      .tab-bar-scroll-container::-webkit-scrollbar-thumb {
        background: #424242;
        border-radius: 3px;
      }
      .tab-bar-scroll-container::-webkit-scrollbar-thumb:hover {
        background: #555555;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Mouse back/forward button navigation for tabs
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Button 3 = back, Button 4 = forward
    if (event.button === 3 || event.button === 4) {
      event.preventDefault();
      event.stopPropagation();
      const currentIndex = tabs.findIndex((t) => t.isActive);
      if (currentIndex === -1) return;

      let newIndex: number;
      if (event.button === 3) {
        // Back - go to previous tab
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        // Forward - go to next tab
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }
      onActivate(tabs[newIndex].id);
    }
  }, [tabs, onActivate]);

  // Mouse wheel horizontal scrolling for tab bar
  const handleWheel = useCallback((event: React.WheelEvent) => {
    // Check if the target is a tab or the tab list container
    const target = event.target as HTMLElement;
    const isTabElement = target.closest('[role="tab"]') !== null;
    const isTabList = target.getAttribute("role") === "tablist";

    // Only scroll horizontally if we're on a tab or the tab list, not on buttons or split buttons
    const isButton = target.tagName === "BUTTON";
    const isSplitButton = target.closest('button[title*="Split"]') !== null;

    if ((isTabElement || isTabList) && !isButton && !isSplitButton) {
      // Prevent default vertical scroll and convert to horizontal
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
        event.preventDefault();
        const container = tabListRef.current;
        if (container) {
          container.scrollLeft += event.deltaY;
        }
      }
    }
  }, []);

  // Start drag for tab reordering
  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    // Only start drag if not clicking on close button
    const target = event.target as HTMLElement;
    if (target.tagName === "BUTTON") return;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));

    // Set drag image
    const dragImage = event.currentTarget as HTMLElement;
    dragImage.style.opacity = "0.6";
  }, []);

  // End drag
  const handleDragEnd = useCallback((event: React.DragEvent) => {
    const dragImage = event.currentTarget as HTMLElement;
    dragImage.style.opacity = "1";
    setDragOverIndex(null);
  }, []);

  // Handle drag over for visual feedback and drop target calculation
  const handleDragOver = useCallback((event: React.DragEvent, targetIndex: number) => {
    if (!onReorder) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverIndex(targetIndex);
  }, [onReorder]);

  // Handle drop to complete reorder
  const handleDrop = useCallback((event: React.DragEvent, targetIndex: number) => {
    if (!onReorder) return;
    event.preventDefault();

    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(fromIndex) && fromIndex !== targetIndex) {
      onReorder(fromIndex, targetIndex);
    }
    setDragOverIndex(null);
  }, [onReorder]);

  // Clear drag over indicator
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

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
            if (t.id !== tabId && !t.isPinned) onClose(t.id);
          }
        },
        disabled: tabs.filter((t) => t.id !== tabId && !t.isPinned).length === 0,
      },
      {
        label: "Close All",
        onSelect: () => {
          for (const t of tabs) {
            if (!t.isPinned) onClose(t.id);
          }
        },
        disabled: tabs.every((t) => t.isPinned),
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
      onMouseDown={handleMouseDown}
      className="tab-bar-scroll-container"
      style={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#1e1e1e",
        borderBottom: "1px solid #2d2d2d",
        minHeight: 35,
        userSelect: "none",
      }}
    >
      {/* Scrollable tab list — only tabs scroll, split buttons stay fixed */}
      <div
        ref={tabListRef}
        onWheel={handleWheel}
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: "#424242 #1e1e1e",
        }}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={Boolean(tab.isActive)}
            tabIndex={tab.isActive ? 0 : -1}
            draggable={Boolean(onReorder)}
            onDragStart={(event) => handleDragStart(event, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, index)}
            onDragLeave={handleDragLeave}
            onDrop={(event) => handleDrop(event, index)}
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
              cursor: "grab",
              color: tab.isActive ? "#ffffff" : "#969696",
              backgroundColor: tab.isActive ? "#1e1e1e" : "#2d2d2d",
              borderRight:
                dragOverIndex === index
                  ? "2px solid #007acc"
                  : "1px solid #2d2d2d",
              borderTop: tab.color
                ? `2px solid ${tab.color}`
                : "2px solid transparent",
              whiteSpace: "nowrap",
              outline: dragOverIndex === index ? "1px solid #007acc" : "none",
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
                style={{ fontSize: 12, color: "#cccccc", flexShrink: 0 }}
              >
                📌
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
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Fixed right-side controls — never scroll away */}
      <div style={{ display: "flex", flexShrink: 0, alignItems: "stretch" }}>
        {onSplit && tabs.length > 0 && (
          <>
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
          </>
        )}

        <div
          aria-hidden="true"
          style={{
            padding: "0 8px",
            display: "flex",
            alignItems: "center",
            color: "#6a6a6a",
            fontSize: 12,
            userSelect: "none",
          }}
          title="Drag tabs to reorder. Right-click a tab for Pin/Unpin."
        >
          ⇄
        </div>
      </div>

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
