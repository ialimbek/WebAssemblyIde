import { generateId } from "@webassembly-ide/shared";
/**
 * Notification Manager — manages toast notifications, status bar messages,
 * and notification history.
 */
export class NotificationManager {
    notifications = new Map();
    listeners = new Set();
    dismissTimers = new Map();
    config;
    constructor(config = {}) {
        this.config = {
            maxNotifications: config.maxNotifications ?? 100,
            defaultAutoDismissMs: config.defaultAutoDismissMs ?? 5000,
        };
    }
    /** Show a notification */
    notify(level, message, options) {
        const id = generateId("notif");
        const notification = {
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
    info(message, options) {
        return this.notify("info", message, options);
    }
    /** Convenience: show warning */
    warn(message, options) {
        return this.notify("warning", message, options);
    }
    /** Convenience: show error */
    error(message, options) {
        return this.notify("error", message, { ...options, autoDismissMs: 0 });
    }
    /** Convenience: show success */
    success(message, options) {
        return this.notify("success", message, options);
    }
    /** Dismiss a notification */
    dismiss(id) {
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
    getActive() {
        return Array.from(this.notifications.values()).filter((n) => !n.dismissed);
    }
    /** Get notification history (including dismissed) */
    getAll() {
        return Array.from(this.notifications.values());
    }
    /** Subscribe to new notifications */
    onNotification(listener) {
        this.listeners.add(listener);
        return {
            dispose: () => {
                this.listeners.delete(listener);
            },
        };
    }
    /** Clear all notifications */
    clear() {
        for (const timer of this.dismissTimers.values()) {
            clearTimeout(timer);
        }
        this.dismissTimers.clear();
        this.notifications.clear();
    }
    /** Dispose */
    dispose() {
        this.clear();
        this.listeners.clear();
    }
    notifyListeners(notification) {
        for (const listener of this.listeners) {
            try {
                listener(notification);
            }
            catch (error) {
                console.error("[NotificationManager] Error in listener:", error);
            }
        }
    }
}
//# sourceMappingURL=notification-manager.js.map