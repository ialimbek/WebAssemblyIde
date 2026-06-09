export interface PersistentCache {
  get<T>(namespace: string, key: string): Promise<T | undefined>;
  set<T>(namespace: string, key: string, value: T, ttlMs?: number): Promise<void>;
  delete(namespace: string, key: string): Promise<void>;
  clear(namespace?: string): Promise<void>;
  prune(maxEntries: number): Promise<void>;
}

const DB_NAME = "codembly-cache";
const STORE_NAME = "entries";

export class IndexedDbCache implements PersistentCache {
  private dbPromise: Promise<IDBDatabase> | undefined;

  async get<T>(namespace: string, key: string): Promise<T | undefined> {
    const entry = await this.withStore<any>("readonly", (store) => store.get(this.id(namespace, key)));
    if (!entry) return undefined;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      await this.delete(namespace, key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(namespace: string, key: string, value: T, ttlMs?: number): Promise<void> {
    await this.withStore("readwrite", (store) => store.put({
      id: this.id(namespace, key),
      namespace,
      key,
      value,
      updatedAt: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    }));
  }

  async delete(namespace: string, key: string): Promise<void> {
    await this.withStore("readwrite", (store) => store.delete(this.id(namespace, key)));
  }

  async clear(namespace?: string): Promise<void> {
    if (!namespace) {
      await this.withStore("readwrite", (store) => store.clear());
      return;
    }
    const entries = await this.withStore<any[]>("readonly", (store) => store.getAll());
    await Promise.all(entries.filter((entry) => entry.namespace === namespace).map((entry) => this.delete(entry.namespace, entry.key)));
  }

  async prune(maxEntries: number): Promise<void> {
    const entries = await this.withStore<any[]>("readonly", (store) => store.getAll());
    const expired = entries.filter((entry) => entry.expiresAt && entry.expiresAt < Date.now());
    const overflow = entries.sort((a, b) => b.updatedAt - a.updatedAt).slice(maxEntries);
    await Promise.all([...expired, ...overflow].map((entry) => this.delete(entry.namespace, entry.key)));
  }

  private id(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  private open(): Promise<IDBDatabase> {
    this.dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  private async withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest | void): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => resolve(request && "result" in request ? request.result as T : undefined as T);
      tx.onerror = () => reject(tx.error);
    });
  }
}
