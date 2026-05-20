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
    definitions = new Map();
    values = new Map([
        ["default", new Map()],
        ["workspace", new Map()],
        ["user", new Map()],
        ["project", new Map()],
    ]);
    config;
    /** Settings change listeners */
    listeners = new Set();
    /** Scope resolution order (lowest to highest priority) */
    scopeOrder = [
        "default",
        "workspace",
        "user",
        "project",
    ];
    constructor(config = {}) {
        this.config = config;
    }
    /** Register a setting definition */
    register(definition) {
        this.definitions.set(definition.key, definition);
        this.values.get("default").set(definition.key, definition.defaultValue);
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
    get(key) {
        for (let i = this.scopeOrder.length - 1; i >= 0; i--) {
            const scope = this.scopeOrder[i];
            const scopeMap = this.values.get(scope);
            if (scopeMap.has(key)) {
                return scopeMap.get(key);
            }
        }
        return undefined;
    }
    /** Set a setting value at a specific scope */
    set(scope, key, value) {
        if (!this.definitions.has(key)) {
            if (this.config.debug) {
                console.warn(`[SettingsManager] Setting "${key}" not registered`);
            }
        }
        this.values.get(scope).set(key, value);
        this.notifyListeners(key, value);
    }
    /** Reset a setting at a specific scope (removes override) */
    reset(scope, key) {
        this.values.get(scope).delete(key);
        const resolved = this.get(key);
        if (resolved !== undefined) {
            this.notifyListeners(key, resolved);
        }
    }
    /** Get all registered setting keys */
    getKeys() {
        return Array.from(this.definitions.keys());
    }
    /** Get all settings as a flat object */
    getAll() {
        const result = {};
        for (const key of this.definitions.keys()) {
            const value = this.get(key);
            if (value !== undefined) {
                result[key] = value;
            }
        }
        return result;
    }
    /** Listen for settings changes */
    onChange(listener) {
        this.listeners.add(listener);
        return {
            dispose: () => {
                this.listeners.delete(listener);
            },
        };
    }
    /** Dispose all */
    dispose() {
        this.definitions.clear();
        for (const [, scopeMap] of this.values) {
            scopeMap.clear();
        }
        this.listeners.clear();
    }
    notifyListeners(key, value) {
        for (const listener of this.listeners) {
            try {
                listener(key, value);
            }
            catch (error) {
                console.error("[SettingsManager] Error in listener:", error);
            }
        }
    }
}
//# sourceMappingURL=settings-manager.js.map