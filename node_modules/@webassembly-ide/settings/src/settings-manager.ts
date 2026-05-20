import type { Disposable, DeepPartial } from "@webassembly-ide/shared";

/** Settings configuration */
export interface SettingsManagerConfig {
  debug?: boolean;
}

/** Settings scope levels */
export type SettingsScope = "default" | "workspace" | "user" | "project";

/** Setting value type */
export type SettingValue = string | number | boolean | object | null;

/** Setting definition with metadata */
export interface SettingDefinition {
  key: string;
  type: "string" | "number" | "boolean" | "object" | "enum";
  defaultValue: SettingValue;
  description?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

/**
 * Settings Manager — hierarchical configuration system.
 *
 * Settings are resolved in order: default → workspace → user → project
 *
 * Usage:
 *   const mgr = new SettingsManager();
 *   mgr.register({ key: "editor.fontSize", type: "number", defaultValue: 14 });
 *   mgr.set("user", "editor.fontSize", 16);
 *   const size = mgr.get<number>("editor.fontSize"); // 16
 */
export class SettingsManager {
  private definitions = new Map<string, SettingDefinition>();
  private values = new Map<SettingsScope, Map<string, SettingValue>>([
    ["default", new Map()],
    ["workspace", new Map()],
    ["user", new Map()],
    ["project", new Map()],
  ]);
  private config: SettingsManagerConfig;

  /** Settings change listeners */
  private listeners = new Set<(key: string, value: SettingValue) => void>();

  /** Scope resolution order (lowest to highest priority) */
  private readonly scopeOrder: SettingsScope[] = [
    "default",
    "workspace",
    "user",
    "project",
  ];

  constructor(config: SettingsManagerConfig = {}) {
    this.config = config;
  }

  /** Register a setting definition */
  register(definition: SettingDefinition): Disposable {
    this.definitions.set(definition.key, definition);
    this.values.get("default")!.set(definition.key, definition.defaultValue);

    return {
      dispose: () => {
        this.definitions.delete(definition.key);
        for (const [, scopeMap] of this.values) {
          scopeMap.delete(definition.key);
        }
      },
    };
  }

  /** Get a setting value, resolved through scope hierarchy */
  get<T = SettingValue>(key: string): T | undefined {
    for (let i = this.scopeOrder.length - 1; i >= 0; i--) {
      const scope = this.scopeOrder[i];
      const scopeMap = this.values.get(scope)!;
      if (scopeMap.has(key)) {
        return scopeMap.get(key) as T;
      }
    }
    return undefined;
  }

  /** Set a setting value at a specific scope */
  set(scope: SettingsScope, key: string, value: SettingValue): void {
    if (!this.definitions.has(key)) {
      if (this.config.debug) {
        console.warn(`[SettingsManager] Setting "${key}" not registered`);
      }
    }
    this.values.get(scope)!.set(key, value);
    this.notifyListeners(key, value);
  }

  /** Reset a setting at a specific scope (removes override) */
  reset(scope: SettingsScope, key: string): void {
    this.values.get(scope)!.delete(key);
    const resolved = this.get(key);
    if (resolved !== undefined) {
      this.notifyListeners(key, resolved);
    }
  }

  /** Get all registered setting keys */
  getKeys(): string[] {
    return Array.from(this.definitions.keys());
  }

  /** Get all settings as a flat object */
  getAll(): Record<string, SettingValue> {
    const result: Record<string, SettingValue> = {};
    for (const key of this.definitions.keys()) {
      const value = this.get(key);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  /** Listen for settings changes */
  onChange(listener: (key: string, value: SettingValue) => void): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Dispose all */
  dispose(): void {
    this.definitions.clear();
    for (const [, scopeMap] of this.values) {
      scopeMap.clear();
    }
    this.listeners.clear();
  }

  private notifyListeners(key: string, value: SettingValue): void {
    for (const listener of this.listeners) {
      try {
        listener(key, value);
      } catch (error) {
        console.error("[SettingsManager] Error in listener:", error);
      }
    }
  }
}
