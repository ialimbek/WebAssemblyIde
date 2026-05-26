/**
 * Tauri-backed NotificationTransport — bridges in-app notifications to the
 * host OS notification center via `@tauri-apps/plugin-notification`.
 *
 * Construction is async because the permission dance has to happen before the
 * transport is considered available. Callers should await `create()` and pass
 * the result into `NotificationManager.setTransport`.
 */

import type {
  Notification,
  NotificationTransport,
} from "@webassembly-ide/notifications";
import { isTauriRuntime } from "./file-system-adapter.js";

type PluginModule = typeof import("@tauri-apps/plugin-notification");

export class TauriNotificationTransport implements NotificationTransport {
  private plugin: PluginModule | null = null;
  private granted = false;

  static async create(): Promise<TauriNotificationTransport | null> {
    if (!isTauriRuntime()) return null;
    const instance = new TauriNotificationTransport();
    try {
      const plugin = await import("@tauri-apps/plugin-notification");
      instance.plugin = plugin;
      const already = await plugin.isPermissionGranted();
      if (already) {
        instance.granted = true;
      } else {
        const result = await plugin.requestPermission();
        instance.granted = result === "granted";
      }
    } catch (err) {
      console.warn(
        "[TauriNotificationTransport] plugin unavailable:",
        err,
      );
      return null;
    }
    return instance;
  }

  isAvailable(): boolean {
    return this.plugin !== null && this.granted;
  }

  send(notification: Notification): void {
    if (!this.plugin || !this.granted) return;
    const title = notification.title ?? defaultTitleFor(notification.level);
    this.plugin.sendNotification({
      title,
      body: notification.message,
    });
  }
}

function defaultTitleFor(level: Notification["level"]): string {
  switch (level) {
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    case "success":
      return "Success";
    default:
      return "Notice";
  }
}
