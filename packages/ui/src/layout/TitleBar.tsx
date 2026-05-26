/**
 * TitleBar — frameless window title bar with OS-style controls.
 *
 * Renders the window drag region, an optional brand area, an embedded menu
 * area, and minimize/maximize/close buttons. Controls are wired through the
 * `controls` prop so the embedding application can supply platform-specific
 * implementations (Tauri webview window vs. browser window).
 *
 * Accessibility: the buttons expose explicit `aria-label`s so screen readers
 * announce the action. The drag region is marked `data-tauri-drag-region` so
 * Tauri webviews initiate native window dragging on pointer down.
 */

import React from "react";

export interface TitleBarControls {
  minimize?: () => void;
  toggleMaximize?: () => void;
  close?: () => void;
  isMaximized?: boolean;
}

export interface TitleBarProps {
  title: string;
  brand?: React.ReactNode;
  menu?: React.ReactNode;
  controls?: TitleBarControls;
  /**
   * When false the right-side window controls are hidden (e.g. when running
   * inside a browser tab where the OS already provides them).
   */
  showWindowControls?: boolean;
  className?: string;
}

const TITLEBAR_HEIGHT = 32;

export function TitleBar({
  title,
  brand,
  menu,
  controls,
  showWindowControls = true,
  className,
}: TitleBarProps) {
  const isMaximized = controls?.isMaximized ?? false;
  return (
    <div
      role="banner"
      aria-label="Application title bar"
      className={className}
      data-tauri-drag-region
      style={{
        display: "flex",
        alignItems: "stretch",
        height: TITLEBAR_HEIGHT,
        background: "#252526",
        borderBottom: "1px solid #1e1e1e",
        color: "#cccccc",
        fontSize: 12,
        userSelect: "none",
        WebkitUserSelect: "none",
        flexShrink: 0,
      }}
    >
      <div
        data-tauri-drag-region
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          minWidth: 120,
        }}
      >
        {brand ?? (
          <span style={{ fontWeight: 600, color: "#e8e8e8" }}>{title}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
        {menu}
      </div>
      <div
        data-tauri-drag-region
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 12px",
          color: "#8a8a8a",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {showWindowControls && (
        <div
          role="group"
          aria-label="Window controls"
          style={{ display: "flex", alignItems: "stretch" }}
        >
          <WindowButton
            label="Minimize"
            onClick={controls?.minimize}
            symbol={
              <svg width="10" height="10" aria-hidden="true">
                <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" />
              </svg>
            }
          />
          <WindowButton
            label={isMaximized ? "Restore" : "Maximize"}
            onClick={controls?.toggleMaximize}
            symbol={
              isMaximized ? (
                <svg width="10" height="10" aria-hidden="true">
                  <rect
                    x="0.5"
                    y="2.5"
                    width="7"
                    height="7"
                    fill="none"
                    stroke="currentColor"
                  />
                  <rect
                    x="2.5"
                    y="0.5"
                    width="7"
                    height="7"
                    fill="none"
                    stroke="currentColor"
                  />
                </svg>
              ) : (
                <svg width="10" height="10" aria-hidden="true">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="9"
                    height="9"
                    fill="none"
                    stroke="currentColor"
                  />
                </svg>
              )
            }
          />
          <WindowButton
            label="Close"
            onClick={controls?.close}
            danger
            symbol={
              <svg width="10" height="10" aria-hidden="true">
                <line
                  x1="0"
                  y1="0"
                  x2="10"
                  y2="10"
                  stroke="currentColor"
                />
                <line
                  x1="10"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke="currentColor"
                />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
}

function WindowButton({
  label,
  onClick,
  symbol,
  danger,
}: {
  label: string;
  onClick?: () => void;
  symbol: React.ReactNode;
  danger?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  const bg = hovered
    ? danger
      ? "#e81123"
      : "rgba(255,255,255,0.08)"
    : "transparent";
  const fg = hovered && danger ? "#ffffff" : "#cccccc";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 46,
        height: "100%",
        border: "none",
        background: bg,
        color: fg,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "background-color 80ms ease-out",
      }}
    >
      {symbol}
    </button>
  );
}
