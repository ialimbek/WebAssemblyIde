/**
 * NotificationCenter — toast notification system and notification history.
 * Integrates with NotificationManager from @webassembly-ide/notifications.
 */

import { useState, useEffect, useCallback } from "react";
import {
  NotificationManager,
  type Notification,
  type NotificationLevel,
} from "@webassembly-ide/notifications";

const LEVEL_COLORS: Record<NotificationLevel, string> = {
  info: "#007acc",
  warning: "#e8a838",
  error: "#f44747",
  success: "#4ec9b0",
};

const LEVEL_ICONS: Record<NotificationLevel, string> = {
  info: "ℹ",
  warning: "⚠",
  error: "✕",
  success: "✓",
};

export interface NotificationCenterProps {
  manager: NotificationManager;
}

/** Toast container rendered at the top-right of the viewport */
export function NotificationToasts({ manager }: NotificationCenterProps) {
  const [toasts, setToasts] = useState<Notification[]>([]);

  const refresh = useCallback(() => {
    setToasts(manager.getActive());
  }, [manager]);

  useEffect(() => {
    refresh();
    const disposable = manager.onNotification(() => refresh());
    return () => disposable.dispose();
  }, [manager, refresh]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: "fixed",
        top: 40,
        right: 16,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 380,
        width: "100%",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          notification={toast}
          onDismiss={() => {
            manager.dismiss(toast.id);
            refresh();
          }}
        />
      ))}
    </div>
  );
}

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const color = LEVEL_COLORS[notification.level];
  const icon = LEVEL_ICONS[notification.level];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "#252526",
        border: `1px solid ${color}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 4,
        padding: "10px 12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        pointerEvents: "all",
        cursor: "default",
      }}
    >
      <span style={{ color, fontSize: 14, fontWeight: "bold", marginTop: 1 }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {notification.title && (
          <div
            style={{
              fontWeight: "bold",
              fontSize: 12,
              color: "#e8e8e8",
              marginBottom: 2,
            }}
          >
            {notification.title}
          </div>
        )}
        <div style={{ fontSize: 12, color: "#cccccc", wordBreak: "break-word" }}>
          {notification.message}
        </div>
        {notification.actions && notification.actions.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {notification.actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.handler();
                  onDismiss();
                }}
                style={{
                  padding: "3px 10px",
                  background: color,
                  border: "none",
                  color: "#fff",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "#999999",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: 2,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

/** Notification history panel — shown inside a sidebar panel or modal */
export function NotificationHistoryPanel({ manager }: NotificationCenterProps) {
  const [history, setHistory] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | NotificationLevel>("all");

  const refresh = useCallback(() => {
    setHistory(manager.getAll().slice().reverse());
  }, [manager]);

  useEffect(() => {
    refresh();
    const notifyDisposable = manager.onNotification(() => refresh());
    const changeDisposable = manager.onChange(() => refresh());
    return () => {
      notifyDisposable.dispose();
      changeDisposable.dispose();
    };
  }, [manager, refresh]);

  const visible =
    filter === "all" ? history : history.filter((n) => n.level === filter);

  return (
    <section
      aria-label="Notification center"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "#cccccc",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #333333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "#999999" }}>
          Notifications ({history.length})
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "error", "warning", "info", "success"] as const).map(
            (level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilter(level)}
                aria-pressed={filter === level}
                style={{
                  background:
                    filter === level ? "var(--button-background, #0e639c)" : "transparent",
                  color: filter === level ? "#ffffff" : "#cccccc",
                  border: "1px solid rgba(128,128,128,0.3)",
                  borderRadius: 3,
                  padding: "1px 6px",
                  cursor: "pointer",
                  fontSize: 10,
                  textTransform: "capitalize",
                }}
              >
                {level}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => manager.clearHistory()}
            style={{
              background: "transparent",
              border: "none",
              color: "#969696",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {visible.length === 0 ? (
          <div style={{ padding: 16, color: "#666666", fontSize: 12 }}>
            No notifications
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 12px",
                borderBottom: "1px solid #2d2d2d",
                alignItems: "flex-start",
              }}
            >
              <span style={{ color: LEVEL_COLORS[n.level], fontSize: 13 }}>
                {LEVEL_ICONS[n.level]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.title && (
                  <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 2 }}>
                    {n.title}
                  </div>
                )}
                <div style={{ fontSize: 12 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#666666", marginTop: 2 }}>
                  {new Date(n.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => {
                  manager.dismiss(n.id);
                  refresh();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#666666",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: 2,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/** Progress indicator for long-running operations */
export interface ProgressOperation {
  id: string;
  label: string;
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
}

export interface ProgressIndicatorProps {
  operations: ProgressOperation[];
}

export function ProgressIndicator({ operations }: ProgressIndicatorProps) {
  if (operations.length === 0) return null;
  return (
    <div
      role="status"
      aria-label="Operation progress"
      style={{
        position: "fixed",
        bottom: 28,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        maxWidth: 320,
        pointerEvents: "none",
      }}
    >
      {operations.map((op) => (
        <div
          key={op.id}
          style={{
            background: "#252526",
            border: "1px solid #454545",
            borderRadius: 4,
            padding: "8px 12px",
            pointerEvents: "all",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 12, color: "#cccccc" }}>{op.label}</span>
            {op.cancellable && op.onCancel && (
              <button
                type="button"
                onClick={op.onCancel}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#969696",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Cancel
              </button>
            )}
          </div>
          <div
            style={{
              height: 4,
              background: "#3c3c3c",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                background: "#007acc",
                width:
                  op.progress !== undefined ? `${op.progress}%` : "100%",
                animation:
                  op.progress === undefined
                    ? "progress-indeterminate 1.5s ease-in-out infinite"
                    : "none",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          {op.progress !== undefined && (
            <div style={{ fontSize: 11, color: "#666666", marginTop: 2, textAlign: "right" }}>
              {Math.round(op.progress)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
