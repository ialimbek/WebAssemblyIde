import type { Disposable } from "@webassembly-ide/shared";
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
export declare class SettingsManager {
    private definitions;
    private values;
    private config;
    /** Settings change listeners */
    private listeners;
    /** Scope resolution order (lowest to highest priority) */
    private readonly scopeOrder;
    constructor(config?: SettingsManagerConfig);
    /** Register a setting definition */
    register(definition: SettingDefinition): Disposable;
    /** Get a setting value, resolved through scope hierarchy */
    get<T = SettingValue>(key: string): T | undefined;
    /** Set a setting value at a specific scope */
    set(scope: SettingsScope, key: string, value: SettingValue): void;
    /** Reset a setting at a specific scope (removes override) */
    reset(scope: SettingsScope, key: string): void;
    /** Get all registered setting keys */
    getKeys(): string[];
    /** Get all settings as a flat object */
    getAll(): Record<string, SettingValue>;
    /** Listen for settings changes */
    onChange(listener: (key: string, value: SettingValue) => void): Disposable;
    /** Dispose all */
    dispose(): void;
    private notifyListeners;
}
//# sourceMappingURL=settings-manager.d.ts.map