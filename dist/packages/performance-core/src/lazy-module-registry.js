/**
 * Lazy Module Registry — manages deferred module loading.
 *
 * Heavy modules (LSP, Wasm, AI connectors, etc.) register here
 * and are loaded on demand, not at startup.
 *
 * Usage:
 *   const registry = new LazyModuleRegistry();
 *   registry.register({ id: "lsp-client", loader: () => import("./lsp"), ... });
 *   const lsp = await registry.get("lsp-client");
 */
export class LazyModuleRegistry {
    modules = new Map();
    /** Register a lazy-loadable module */
    register(definition) {
        this.modules.set(definition.id, {
            definition: definition,
            state: "pending",
        });
        return {
            dispose: () => {
                this.modules.delete(definition.id);
            },
        };
    }
    /** Get a module, loading it if needed */
    async get(id) {
        const entry = this.modules.get(id);
        if (!entry) {
            throw new Error(`Module "${id}" not registered`);
        }
        if (entry.state === "loaded" && entry.instance) {
            return entry.instance;
        }
        if (entry.loadPromise) {
            return entry.loadPromise;
        }
        entry.state = "loading";
        entry.loadPromise = this.loadWithDependencies(entry);
        try {
            const instance = await entry.loadPromise;
            entry.instance = instance;
            entry.state = "loaded";
            return instance;
        }
        catch (error) {
            entry.state = "error";
            entry.error = error instanceof Error ? error : new Error(String(error));
            throw entry.error;
        }
        finally {
            entry.loadPromise = undefined;
        }
    }
    /** Check if a module is registered */
    has(id) {
        return this.modules.has(id);
    }
    /** Get the state of a module */
    getState(id) {
        return this.modules.get(id)?.state ?? "pending";
    }
    /** Get all registered module IDs */
    getRegisteredIds() {
        return Array.from(this.modules.keys());
    }
    /** Get all loaded module IDs */
    getLoadedIds() {
        return Array.from(this.modules.entries())
            .filter(([, entry]) => entry.state === "loaded")
            .map(([id]) => id);
    }
    /** Unregister all modules */
    dispose() {
        this.modules.clear();
    }
    async loadWithDependencies(entry) {
        const deps = entry.definition.dependencies;
        if (deps && deps.length > 0) {
            await Promise.all(deps.map((depId) => this.get(depId)));
        }
        return entry.definition.loader();
    }
}
//# sourceMappingURL=lazy-module-registry.js.map