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
    actions?: Array<{
        label: string;
        handler: () => void;
    }>;
}
/**
 * Notification Manager — manages toast notifications, status bar messages,
 * and notification history.
 */
export declare class NotificationManager {
    private notifications;
    private listeners;
    private dismissTimers;
    private config;
    constructor(config?: NotificationManagerConfig);
    /** Show a notification */
    notify(level: NotificationLevel, message: string, options?: {
        title?: string;
        autoDismissMs?: number;
        actions?: Notification["actions"];
    }): string;
    /** Convenience: show info */
    info(message: string, options?: {
        title?: string;
    }): string;
    /** Convenience: show warning */
    warn(message: string, options?: {
        title?: string;
    }): string;
    /** Convenience: show error */
    error(message: string, options?: {
        title?: string;
    }): string;
    /** Convenience: show success */
    success(message: string, options?: {
        title?: string;
    }): string;
    /** Dismiss a notification */
    dismiss(id: string): void;
    /** Get all active (non-dismissed) notifications */
    getActive(): Notification[];
    /** Get notification history (including dismissed) */
    getAll(): Notification[];
    /** Subscribe to new notifications */
    onNotification(listener: (notification: Notification) => void): Disposable;
    /** Clear all notifications */
    clear(): void;
    /** Dispose */
    dispose(): void;
    private notifyListeners;
}
//# sourceMappingURL=notification-manager.d.ts.map