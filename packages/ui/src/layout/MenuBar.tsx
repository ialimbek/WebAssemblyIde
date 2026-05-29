import React, { useState } from "react";

export type MenuItemKind = "item" | "separator" | "checkbox" | "submenu";

export interface MenuItemDefinition {
  id: string;
  label: string;
  kind?: MenuItemKind;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  children?: MenuItemDefinition[];
  onSelect?: () => void;
}

export interface MenuDefinition {
  id: string;
  label: string;
  items: MenuItemDefinition[];
}

export interface MenuBarProps {
  menus: MenuDefinition[];
  title?: React.ReactNode;
}

export function MenuBar({ menus, title }: MenuBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div
      role="menubar"
      aria-label="Application menu"
      style={{
        display: "flex",
        alignItems: "center",
        height: 30,
        minHeight: 30,
        backgroundColor: "var(--titleBar-activeBackground, #181818)",
        borderBottom: "1px solid var(--sideBar-border, #333333)",
        color: "var(--editor-foreground, #cccccc)",
        userSelect: "none",
      }}
      onMouseLeave={() => setOpenMenuId(null)}
    >
      {menus.map((menu) => {
        const isOpen = openMenuId === menu.id;
        return (
          <div key={menu.id} style={{ position: "relative", height: "100%" }}>
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpenMenuId(isOpen ? null : menu.id)}
              onMouseEnter={() => openMenuId && setOpenMenuId(menu.id)}
              style={menuButtonStyle(isOpen)}
            >
              {menu.label}
            </button>
            {isOpen && (
              <MenuDropdown
                items={menu.items}
                onClose={() => setOpenMenuId(null)}
              />
            )}
          </div>
        );
      })}
      <div
        aria-hidden={!title}
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 12,
          color: "var(--editor-foreground, #9d9d9d)",
          pointerEvents: "none",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function MenuDropdown({
  items,
  onClose,
}: {
  items: MenuItemDefinition[];
  onClose: () => void;
}) {
  return (
    <div
      role="menu"
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 1000,
        minWidth: 220,
        padding: "4px 0",
        backgroundColor: "var(--panel-background, #252526)",
        border: "1px solid var(--sideBar-border, #454545)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      }}
    >
      {items.map((item) => (
        <MenuItem key={item.id} item={item} onClose={onClose} />
      ))}
    </div>
  );
}

function MenuItem({
  item,
  onClose,
}: {
  item: MenuItemDefinition;
  onClose: () => void;
}) {
  if (item.kind === "separator") {
    return (
      <div
        role="separator"
        style={{ height: 1, background: "#454545", margin: "4px 0" }}
      />
    );
  }

  const hasSubmenu = item.kind === "submenu" && item.children?.length;

  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      aria-checked={item.kind === "checkbox" ? item.checked : undefined}
      onClick={() => {
        if (item.disabled || hasSubmenu) return;
        item.onSelect?.();
        onClose();
      }}
      style={menuItemStyle(item.disabled)}
    >
      <span style={{ width: 18 }}>
        {item.kind === "checkbox" ? (item.checked ? "✓" : "") : ""}
      </span>
      <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
      {item.shortcut && (
        <span style={{ color: "var(--editor-foreground, #9d9d9d)", marginLeft: 16 }}>
          {item.shortcut}
        </span>
      )}
      {hasSubmenu && <span style={{ marginLeft: 16 }}>›</span>}
    </button>
  );
}

function menuButtonStyle(active: boolean): React.CSSProperties {
  return {
    height: "100%",
    padding: "0 10px",
    border: 0,
    background: active ? "#2d2d2d" : "transparent",
    color: "var(--editor-foreground, #cccccc)",
    cursor: "pointer",
    font: "inherit",
  };
}

function menuItemStyle(disabled?: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: 6,
    padding: "5px 10px",
    border: 0,
    background: "transparent",
    color: disabled ? "#6f6f6f" : "#cccccc",
    cursor: disabled ? "default" : "pointer",
    font: "inherit",
    fontSize: 12,
  };
}
