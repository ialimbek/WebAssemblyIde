import { generateId } from "@webassembly-ide/shared";
import type { Disposable } from "@webassembly-ide/shared";

/** Notification severity level */
export type NotificationLevel = "info" | "warning" | "error" | "success";

/** Configuration */
export interface NotificationManagerConfig {
  maxNotifications?: number;
  defaultAutoDismissMs?: number;
}

/** A notification entry */
export interface Notification {
  id: string;
  level: NotificationLevel;
  message: string;
  title?: string;
  timestamp: number;
  autoDismissMs?: number;
  dismissed?: boolean;
  actions?: Array<{ label: string; handler: () => void }>;
}

/**
 * Notification Manager — manages toast notifications, status bar messages,
 * and notification history.
 */
export class NotificationManager {
  private notifications = new Map<string, Notification>();
  private listeners = new Set<(notification: Notification) => void>();
  private dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private config: Required<NotificationManagerConfig>;

  constructor(config: NotificationManagerConfig = {}) {
    this.config = {
      maxNotifications: config.maxNotifications ?? 100,
      defaultAutoDismissMs: config.defaultAutoDismissMs ?? 5000,
    };
  }

  /** Show a notification */
  notify(
    level: NotificationLevel,
    message: string,
    options?: {
      title?: string;
      autoDismissMs?: number;
      actions?: Notification["actions"];
    },
  ): string {
    const id = generateId("notif");
    const notification: Notification = {
      id,
      level,
      message,
      title: options?.title,
      timestamp: Date.now(),
      autoDismissMs: options?.autoDismissMs ?? this.config.defaultAutoDismissMs,
      actions: options?.actions,
    };

    this.notifications.set(id, notification);

    // Trim old notifications
    if (this.notifications.size > this.config.maxNotifications) {
      const oldest = this.notifications.keys().next().value;
      if (oldest) {
        this.dismiss(oldest);
      }
    }

    // Auto-dismiss
    if (notification.autoDismissMs && notification.autoDismissMs > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, notification.autoDismissMs);
      this.dismissTimers.set(id, timer);
    }

    this.notifyListeners(notification);
    return id;
  }

  /** Convenience: show info */
  info(message: string, options?: { title?: string }): string {
    return this.notify("info", message, options);
  }

  /** Convenience: show warning */
  warn(message: string, options?: { title?: string }): string {
    return this.notify("warning", message, options);
  }

  /** Convenience: show error */
  error(message: string, options?: { title?: string }): string {
    return this.notify("error", message, { ...options, autoDismissMs: 0 });
  }

  /** Convenience: show success */
  success(message: string, options?: { title?: string }): string {
    return this.notify("success", message, options);
  }

  /** Dismiss a notification */
  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.dismissed = true;
      this.notifications.delete(id);
    }
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
  }

  /** Get all active (non-dismissed) notifications */
  getActive(): Notification[] {
    return Array.from(this.notifications.values()).filter((n) => !n.dismissed);
  }

  /** Get notification history (including dismissed) */
  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /** Subscribe to new notifications */
  onNotification(listener: (notification: Notification) => void): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Clear all notifications */
  clear(): void {
    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer);
    }
    this.dismissTimers.clear();
    this.notifications.clear();
  }

  /** Dispose */
  dispose(): void {
    this.clear();
    this.listeners.clear();
  }

  private notifyListeners(notification: Notification): void {
    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch (error) {
        console.error("[NotificationManager] Error in listener:", error);
      }
    }
  }
}
