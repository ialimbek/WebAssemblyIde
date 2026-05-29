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
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const pendingDragIndexRef = useRef<number | null>(null);

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
        background: var(--editorGroupHeader-tabsBackground, #1e1e1e);
      }
      .tab-bar-scroll-container::-webkit-scrollbar-thumb {
        background: var(--scrollbarSlider-background, #424242);
        border-radius: 3px;
      }
      .tab-bar-scroll-container::-webkit-scrollbar-thumb:hover {
        background: var(--focusBorder, #555555);
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

  const handleTabPointerDown = useCallback((event: React.MouseEvent, index: number) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "BUTTON") return;
    if (!onReorder) return;

    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    pendingDragIndexRef.current = index;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - dragStartXRef.current);
      const dy = Math.abs(e.clientY - dragStartYRef.current);

      if (pendingDragIndexRef.current !== null && (dx >= 5 || dy >= 5)) {
        setDraggingIndex(pendingDragIndexRef.current);
        setIsDragging(true);
        pendingDragIndexRef.current = null;
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      pendingDragIndexRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [onReorder]);

  useEffect(() => {
    if (draggingIndex === null || !isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();

      const container = tabListRef.current;
      if (!container) return;

      const tabElements = container.querySelectorAll<HTMLElement>('[role="tab"]');
      let newIndex: number | null = null;

      for (let i = 0; i < tabElements.length; i++) {
        const rect = tabElements[i].getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (event.clientX < midX) {
          newIndex = i;
          break;
        }
      }
      if (newIndex === null && tabElements.length > 0) {
        newIndex = tabElements.length - 1;
      }

      if (newIndex !== null && newIndex !== dragOverIndex) {
        setDragOverIndex(newIndex);
      }
    };

    const handleMouseUp = () => {
      if (dragOverIndex !== null && dragOverIndex !== draggingIndex && onReorder) {
        onReorder(draggingIndex, dragOverIndex);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingIndex, isDragging, dragOverIndex, onReorder]);

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
        backgroundColor: "var(--editorGroupHeader-tabsBackground, var(--panel-background, #1e1e1e))",
        borderBottom: "1px solid var(--editorGroupHeader-tabsBorder, var(--tab-border, #2d2d2d))",
        minHeight: 42,
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
          scrollbarColor: "var(--scrollbarSlider-background, #424242) var(--editorGroupHeader-tabsBackground, #1e1e1e)",
        }}
      >
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={Boolean(tab.isActive)}
            tabIndex={tab.isActive ? 0 : -1}
            onMouseDown={(event) => {
              handleTabPointerDown(event, index);
            }}
            onClick={() => {
              if (!isDragging) onActivate(tab.id);
            }}
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
              minWidth: 140,
              maxWidth: 240,
              padding: "0 10px",
              gap: 6,
              cursor: isDragging && draggingIndex === index ? "grabbing" : "default",
              color: tab.isActive
                ? "var(--tab-activeForeground, #ffffff)"
                : "var(--tab-inactiveForeground, #969696)",
              backgroundColor: tab.isActive
                ? "var(--tab-activeBackground, var(--editor-background, #1e1e1e))"
                : "var(--tab-inactiveBackground, var(--panel-background, #2d2d2d))",
              borderRight:
                dragOverIndex === index
                  ? "2px solid var(--focusBorder, #007acc)"
                  : "1px solid var(--tab-border, #2d2d2d)",
              borderTop: tab.color
                ? `2px solid ${tab.color}`
                : "2px solid transparent",
              whiteSpace: "nowrap",
              outline: dragOverIndex === index ? "1px solid var(--focusBorder, #007acc)" : "none",
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
                style={{ fontSize: 12, color: "var(--tab-activeForeground, #cccccc)", flexShrink: 0 }}
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
                  color: "var(--tab-inactiveForeground, #969696)",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  fontSize: 20,
                  lineHeight: 1,
                  fontWeight: 500,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background =
                    "var(--list-hoverBackground, rgba(128,128,128,0.18))";
                  event.currentTarget.style.color =
                    "var(--tab-activeForeground, #ffffff)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                  event.currentTarget.style.color =
                    "var(--tab-inactiveForeground, #969696)";
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
            color: "var(--descriptionForeground, #6a6a6a)",
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
            border: "1px solid var(--sideBar-border, rgba(128,128,128,0.3))",
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
                color: item.danger ? "#f44747" : "var(--menu-foreground, #cccccc)",
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
  borderLeft: "1px solid var(--tab-border, #2d2d2d)",
  background: "var(--editorGroupHeader-tabsBackground, var(--panel-background, #252526))",
  color: "var(--tab-inactiveForeground, #cccccc)",
  padding: "0 10px",
  cursor: "pointer",
};
