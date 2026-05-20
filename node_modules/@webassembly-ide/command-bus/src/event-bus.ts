import type { Disposable } from "@webassembly-ide/shared";

/** Configuration for the Event Bus */
export interface EventBusConfig {
  /** Enable debug logging */
  debug?: boolean;
}

/** Event metadata */
export interface EventMeta {
  /** Timestamp when event was emitted */
  timestamp: number;
  /** Source that emitted the event */
  source?: string;
}

/** Event handler function */
export type EventHandler<TPayload = unknown> = (
  payload: TPayload,
  meta: EventMeta,
) => void;

/** Subscription entry */
interface Subscription {
  handler: EventHandler<unknown>;
  once: boolean;
}

/**
 * Event Bus — publish/subscribe event system.
 *
 * Events represent state changes that modules can react to.
 * Unlike commands (point-to-point), events are broadcast (one-to-many).
 *
 * Usage:
 *   const bus = new EventBus();
 *   bus.on("file:changed", (payload) => { ... });
 *   bus.emit("file:changed", { path: "..." });
 */
export class EventBus {
  private listeners = new Map<string, Set<Subscription>>();
  private config: EventBusConfig;

  constructor(config: EventBusConfig = {}) {
    this.config = config;
  }

  /**
   * Subscribe to an event
   */
  on<TPayload = unknown>(
    eventName: string,
    handler: EventHandler<TPayload>,
  ): Disposable {
    return this.subscribe(eventName, handler as EventHandler<unknown>, false);
  }

  /**
   * Subscribe to an event (once only)
   */
  once<TPayload = unknown>(
    eventName: string,
    handler: EventHandler<TPayload>,
  ): Disposable {
    return this.subscribe(eventName, handler as EventHandler<unknown>, true);
  }

  /**
   * Unsubscribe a handler from an event
   */
  off<TPayload = unknown>(
    eventName: string,
    handler: EventHandler<TPayload>,
  ): void {
    const subs = this.listeners.get(eventName);
    if (!subs) return;

    for (const sub of subs) {
      if (sub.handler === handler) {
        subs.delete(sub);
        break;
      }
    }

    if (subs.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<TPayload = unknown>(
    eventName: string,
    payload: TPayload,
    source?: string,
  ): void {
    const subs = this.listeners.get(eventName);
    if (!subs || subs.size === 0) return;

    const meta: EventMeta = {
      timestamp: Date.now(),
      source,
    };

    if (this.config.debug) {
      console.debug(
        `[EventBus] Emitting "${eventName}" to ${subs.size} subscriber(s)`,
      );
    }

    const toRemove: Subscription[] = [];

    for (const sub of subs) {
      try {
        sub.handler(payload, meta);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${eventName}":`, error);
      }

      if (sub.once) {
        toRemove.push(sub);
      }
    }

    for (const sub of toRemove) {
      subs.delete(sub);
    }
  }

  /**
   * Get all registered event names
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get subscriber count for an event
   */
  getSubscriberCount(eventName: string): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }

  /**
   * Remove all subscriptions
   */
  dispose(): void {
    this.listeners.clear();
  }

  private subscribe(
    eventName: string,
    handler: EventHandler<unknown>,
    once: boolean,
  ): Disposable {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const sub: Subscription = { handler, once };
    this.listeners.get(eventName)!.add(sub);

    return {
      dispose: () => {
        const subs = this.listeners.get(eventName);
        if (subs) {
          subs.delete(sub);
          if (subs.size === 0) {
            this.listeners.delete(eventName);
          }
        }
      },
    };
  }
}
