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
export type EventHandler<TPayload = unknown> = (payload: TPayload, meta: EventMeta) => void;
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
export declare class EventBus {
    private listeners;
    private config;
    constructor(config?: EventBusConfig);
    /**
     * Subscribe to an event
     */
    on<TPayload = unknown>(eventName: string, handler: EventHandler<TPayload>): Disposable;
    /**
     * Subscribe to an event (once only)
     */
    once<TPayload = unknown>(eventName: string, handler: EventHandler<TPayload>): Disposable;
    /**
     * Unsubscribe a handler from an event
     */
    off<TPayload = unknown>(eventName: string, handler: EventHandler<TPayload>): void;
    /**
     * Emit an event to all subscribers
     */
    emit<TPayload = unknown>(eventName: string, payload: TPayload, source?: string): void;
    /**
     * Get all registered event names
     */
    getEventNames(): string[];
    /**
     * Get subscriber count for an event
     */
    getSubscriberCount(eventName: string): number;
    /**
     * Remove all subscriptions
     */
    dispose(): void;
    private subscribe;
}
//# sourceMappingURL=event-bus.d.ts.map