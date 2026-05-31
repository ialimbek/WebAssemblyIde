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
  onPreview?: () => void;
  onCancelPreview?: () => void;
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
        backgroundColor: "var(--titleBar-activeBackground, var(--menu-background, #181818))",
        borderBottom: "1px solid var(--menu-border, var(--sideBar-border, #333333))",
        color: "var(--menu-foreground, var(--editor-foreground, #cccccc))",
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
              onMouseEnter={(e) => {
                if (openMenuId) {
                  setOpenMenuId(menu.id);
                } else if (!isOpen) {
                  const target = e.currentTarget as HTMLElement;
                  target.style.background = "var(--menu-button-hoverBackground, rgba(0,122,204,0.18))";
                  target.style.color = "var(--menu-button-hoverForeground, var(--editor-foreground, #ffffff))";
                  target.style.boxShadow = "inset 0 -2px 0 var(--focusBorder, #007acc)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isOpen) {
                  const target = e.currentTarget as HTMLElement;
                  target.style.background = "transparent";
                  target.style.color = "var(--menu-foreground, var(--editor-foreground, #cccccc))";
                  target.style.boxShadow = "none";
                }
              }}
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
        backgroundColor: "var(--menu-background, var(--panel-background, #252526))",
        border: "1px solid var(--menu-border, var(--sideBar-border, #454545))",
        boxShadow: "var(--menu-shadow, 0 6px 18px rgba(0,0,0,0.35))",
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
  const [submenuOpen, setSubmenuOpen] = useState(false);
  if (item.kind === "separator") {
    return (
      <div
        role="separator"
        style={{ height: 1, background: "var(--menu-separatorBackground, #454545)", margin: "4px 0" }}
      />
    );
  }

  const hasSubmenu = item.kind === "submenu" && item.children?.length;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => {
        setSubmenuOpen(true);
        if (!hasSubmenu && !item.disabled) item.onPreview?.();
      }}
      onMouseLeave={() => {
        setSubmenuOpen(false);
        item.onCancelPreview?.();
      }}
    >
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        aria-haspopup={hasSubmenu ? "menu" : undefined}
        aria-expanded={hasSubmenu ? submenuOpen : undefined}
        aria-checked={item.kind === "checkbox" ? item.checked : undefined}
        onFocus={() => {
          setSubmenuOpen(true);
          if (!hasSubmenu && !item.disabled) item.onPreview?.();
        }}
        onClick={() => {
          if (item.disabled || hasSubmenu) return;
          item.onSelect?.();
          onClose();
        }}
        style={menuItemStyle(item.disabled)}
        onMouseEnter={(e) => {
          if (!item.disabled) {
            const target = e.currentTarget as HTMLElement;
            target.style.background = "var(--menu-item-hoverBackground, rgba(0,122,204,0.16))";
            target.style.color = "var(--menu-item-hoverForeground, var(--editor-foreground, #ffffff))";
            target.style.outline = "1px solid var(--focusBorder, #007acc)";
            target.style.outlineOffset = "-1px";
          }
        }}
        onMouseLeave={(e) => {
          if (!item.disabled) {
            const target = e.currentTarget as HTMLElement;
            target.style.background = "transparent";
            target.style.color = "var(--menu-foreground, #cccccc)";
            target.style.outline = "none";
          }
        }}
      >
        <span style={{ width: 18 }}>
          {item.kind === "checkbox" ? (item.checked ? "✓" : "") : ""}
        </span>
        <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
        {item.shortcut && (
          <span style={{ color: "var(--menu-foreground, var(--tab-inactiveForeground, #9d9d9d))", marginLeft: 16 }}>
            {item.shortcut}
          </span>
        )}
        {hasSubmenu && <span style={{ marginLeft: 16 }}>›</span>}
      </button>
      {hasSubmenu && submenuOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: -4,
            left: "100%",
            zIndex: 1001,
            minWidth: 240,
            padding: "4px 0",
            backgroundColor: "var(--menu-background, var(--panel-background, #252526))",
            border: "1px solid var(--menu-border, var(--sideBar-border, #454545))",
            boxShadow: "var(--menu-shadow, 0 8px 24px rgba(0,0,0,0.4))",
          }}
        >
          {item.children?.map((child) => (
            <MenuItem key={child.id} item={child} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

function menuButtonStyle(active: boolean): React.CSSProperties {
  return {
    height: "100%",
    padding: "0 10px",
    border: 0,
    background: active ? "var(--menu-selectionBackground, #2d2d2d)" : "transparent",
    color: active
      ? "var(--menu-selectionForeground, var(--editor-foreground, #ffffff))"
      : "var(--menu-foreground, var(--editor-foreground, #cccccc))",
    cursor: "pointer",
    font: "inherit",
    transition: "background 0.15s ease",
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
    color: disabled ? "var(--menu-foreground, #6f6f6f)" : "var(--menu-foreground, #cccccc)",
    cursor: disabled ? "default" : "pointer",
    font: "inherit",
    fontSize: 12,
    transition: "background 0.15s ease",
  };
}
