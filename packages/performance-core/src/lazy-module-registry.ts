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

/** Internal registration entry */
interface ModuleEntry<T = unknown> {
  definition: LazyModuleDefinition<T>;
  state: LazyModuleState;
  instance?: T;
  error?: Error;
  loadPromise?: Promise<T>;
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
export class LazyModuleRegistry {
  private modules = new Map<string, ModuleEntry>();

  /** Register a lazy-loadable module */
  register<T = unknown>(definition: LazyModuleDefinition<T>): Disposable {
    this.modules.set(definition.id, {
      definition: definition as LazyModuleDefinition,
      state: "pending",
    });

    return {
      dispose: () => {
        this.modules.delete(definition.id);
      },
    };
  }

  /** Get a module, loading it if needed */
  async get<T = unknown>(id: string): Promise<T> {
    const entry = this.modules.get(id);
    if (!entry) {
      throw new Error(`Module "${id}" not registered`);
    }

    if (entry.state === "loaded" && entry.instance) {
      return entry.instance as T;
    }

    if (entry.loadPromise) {
      return entry.loadPromise as Promise<T>;
    }

    entry.state = "loading";

    entry.loadPromise = this.loadWithDependencies(entry);
    try {
      const instance = await entry.loadPromise;
      entry.instance = instance;
      entry.state = "loaded";
      return instance as T;
    } catch (error) {
      entry.state = "error";
      entry.error = error instanceof Error ? error : new Error(String(error));
      throw entry.error;
    } finally {
      entry.loadPromise = undefined;
    }
  }

  /** Check if a module is registered */
  has(id: string): boolean {
    return this.modules.has(id);
  }

  /** Get the state of a module */
  getState(id: string): LazyModuleState {
    return this.modules.get(id)?.state ?? "pending";
  }

  /** Get all registered module IDs */
  getRegisteredIds(): string[] {
    return Array.from(this.modules.keys());
  }

  /** Get all loaded module IDs */
  getLoadedIds(): string[] {
    return Array.from(this.modules.entries())
      .filter(([, entry]) => entry.state === "loaded")
      .map(([id]) => id);
  }

  /** Unregister all modules */
  dispose(): void {
    this.modules.clear();
  }

  private async loadWithDependencies<T>(entry: ModuleEntry<T>): Promise<T> {
    const deps = entry.definition.dependencies;
    if (deps && deps.length > 0) {
      await Promise.all(deps.map((depId) => this.get(depId)));
    }
    return entry.definition.loader();
  }
}
