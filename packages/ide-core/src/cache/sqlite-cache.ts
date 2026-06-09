import type { PersistentCache } from "./indexeddb-cache.js";

export interface SqliteCacheBridge {
  get(namespace: string, key: string): Promise<unknown>;
  set(namespace: string, key: string, value: unknown, ttlMs?: number): Promise<void>;
  delete(namespace: string, key: string): Promise<void>;
  clear(namespace?: string): Promise<void>;
  prune(maxEntries: number): Promise<void>;
}

export class SqliteCache implements PersistentCache {
  constructor(private readonly bridge: SqliteCacheBridge) {}

  async get<T>(namespace: string, key: string): Promise<T | undefined> {
    return await this.bridge.get(namespace, key) as T | undefined;
  }

  async set<T>(namespace: string, key: string, value: T, ttlMs?: number): Promise<void> {
    await this.bridge.set(namespace, key, value, ttlMs);
  }

  async delete(namespace: string, key: string): Promise<void> {
    await this.bridge.delete(namespace, key);
  }

  async clear(namespace?: string): Promise<void> {
    await this.bridge.clear(namespace);
  }

  async prune(maxEntries: number): Promise<void> {
    await this.bridge.prune(maxEntries);
  }
}
