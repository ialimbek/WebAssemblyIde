import type { Disposable } from "@webassembly-ide/shared";
/** State of a lazy module */
export type LazyModuleState = "pending" | "loading" | "loaded" | "error";
/** Definition of a lazy-loadable module */
export interface LazyModuleDefinition<T = unknown> {
    id: string;
    description: string;
    loader: () => Promise<T>;
    dependencies?: string[];
}
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
export declare class LazyModuleRegistry {
    private modules;
    /** Register a lazy-loadable module */
    register<T = unknown>(definition: LazyModuleDefinition<T>): Disposable;
    /** Get a module, loading it if needed */
    get<T = unknown>(id: string): Promise<T>;
    /** Check if a module is registered */
    has(id: string): boolean;
    /** Get the state of a module */
    getState(id: string): LazyModuleState;
    /** Get all registered module IDs */
    getRegisteredIds(): string[];
    /** Get all loaded module IDs */
    getLoadedIds(): string[];
    /** Unregister all modules */
    dispose(): void;
    private loadWithDependencies;
}
//# sourceMappingURL=lazy-module-registry.d.ts.map