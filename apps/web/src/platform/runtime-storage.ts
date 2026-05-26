/**
 * Runtime-scoped localStorage helpers.
 *
 * Recent files / recent workspaces / runtime-specific UI state must not bleed
 * between the browser demo runtime and the Tauri desktop runtime. The desktop
 * runtime stores real OS paths; reusing them inside the in-memory browser
 * adapter would surface "file not found" errors and vice versa.
 *
 * This module returns a stable prefix per runtime and exposes a small typed
 * wrapper that also migrates legacy unprefixed keys on first read.
 */

import { isTauriRuntime } from "./file-system-adapter.js";

export type RuntimeKind = "tauri" | "web";

export function detectRuntimeKind(): RuntimeKind {
  return isTauriRuntime() ? "tauri" : "web";
}

export function runtimeStorageKey(key: string): string {
  return `ide.${detectRuntimeKind()}.${key}`;
}

/**
 * Read a JSON-encoded value. Falls back to a legacy (unscoped) `ide.<key>`
 * entry on first read and migrates it to the runtime-scoped key.
 */
export function readRuntimeJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  const scoped = runtimeStorageKey(key);
  const legacy = `ide.${key}`;

  try {
    const scopedRaw = localStorage.getItem(scoped);
    if (scopedRaw !== null) {
      return JSON.parse(scopedRaw) as T;
    }
    const legacyRaw = localStorage.getItem(legacy);
    if (legacyRaw !== null) {
      // Migrate once, then keep the legacy entry around so the other runtime
      // can still read it (it'll be migrated on its own first read too).
      localStorage.setItem(scoped, legacyRaw);
      return JSON.parse(legacyRaw) as T;
    }
  } catch {
    // Malformed JSON — treat as missing.
  }
  return fallback;
}

export function writeRuntimeJSON(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(runtimeStorageKey(key), JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — best-effort write.
  }
}
