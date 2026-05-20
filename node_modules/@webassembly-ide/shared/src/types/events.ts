/** Map of event names to their payload types */
export type EventMap = Record<string, unknown>;

/** Event handler function */
export type EventHandler<T = unknown> = (payload: T) => void;

/** Disposable resource that can be cleaned up */
export interface Disposable {
  dispose(): void;
}

/** Event emitter interface */
export interface EventEmitter<TEventMap extends EventMap> {
  on<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>,
  ): Disposable;
  off<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>,
  ): void;
  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void;
}
