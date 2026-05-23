import { generateId } from "@webassembly-ide/shared";
/**
 * Notification Manager — manages toast notifications, status bar messages,
 * and notification history.
 */
export class NotificationManager {
    notifications = new Map();
    history = [];
    listeners = new Set();
    changeListeners = new Set();
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
        this.history.push(notification);
        // Trim old notifications
        if (this.notifications.size > this.config.maxNotifications) {
            const oldest = this.notifications.keys().next().value;
            if (oldest) {
                this.dismiss(oldest);
            }
        }
        if (this.history.length > this.config.maxNotifications * 4) {
            this.history.splice(0, this.history.length - this.config.maxNotifications * 4);
        }
        // Auto-dismiss
        if (notification.autoDismissMs && notification.autoDismissMs > 0) {
            const timer = setTimeout(() => {
                this.dismiss(id);
            }, notification.autoDismissMs);
            this.dismissTimers.set(id, timer);
        }
        this.notifyListeners(notification);
        this.emitChange();
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
        this.emitChange();
    }
    /** Get all active (non-dismissed) notifications */
    getActive() {
        return Array.from(this.notifications.values()).filter((n) => !n.dismissed);
    }
    /** Get notification history (including dismissed) */
    getAll() {
        return [...this.history];
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
    /**
     * Subscribe to lifecycle changes (notify / dismiss / clear / clearHistory).
     * Useful for history-view UIs that need to refresh on any mutation.
     */
    onChange(listener) {
        this.changeListeners.add(listener);
        return {
            dispose: () => {
                this.changeListeners.delete(listener);
            },
        };
    }
    /** Clear active notifications. History is preserved. */
    clear() {
        for (const timer of this.dismissTimers.values()) {
            clearTimeout(timer);
        }
        this.dismissTimers.clear();
        this.notifications.clear();
        this.emitChange();
    }
    /** Clear the full notification history (and active notifications). */
    clearHistory() {
        this.clear();
        this.history = [];
        this.emitChange();
    }
    /** Dispose */
    dispose() {
        this.clear();
        this.history = [];
        this.listeners.clear();
        this.changeListeners.clear();
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
    emitChange() {
        for (const listener of this.changeListeners) {
            try {
                listener();
            }
            catch (error) {
                console.error("[NotificationManager] Error in change listener:", error);
            }
        }
    }
}
//# sourceMappingURL=notification-manager.js.map