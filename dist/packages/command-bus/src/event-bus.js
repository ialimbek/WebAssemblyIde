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
    listeners = new Map();
    config;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Subscribe to an event
     */
    on(eventName, handler) {
        return this.subscribe(eventName, handler, false);
    }
    /**
     * Subscribe to an event (once only)
     */
    once(eventName, handler) {
        return this.subscribe(eventName, handler, true);
    }
    /**
     * Unsubscribe a handler from an event
     */
    off(eventName, handler) {
        const subs = this.listeners.get(eventName);
        if (!subs)
            return;
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
    emit(eventName, payload, source) {
        const subs = this.listeners.get(eventName);
        if (!subs || subs.size === 0)
            return;
        const meta = {
            timestamp: Date.now(),
            source,
        };
        if (this.config.debug) {
            console.debug(`[EventBus] Emitting "${eventName}" to ${subs.size} subscriber(s)`);
        }
        const toRemove = [];
        for (const sub of subs) {
            try {
                sub.handler(payload, meta);
            }
            catch (error) {
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
    getEventNames() {
        return Array.from(this.listeners.keys());
    }
    /**
     * Get subscriber count for an event
     */
    getSubscriberCount(eventName) {
        return this.listeners.get(eventName)?.size ?? 0;
    }
    /**
     * Remove all subscriptions
     */
    dispose() {
        this.listeners.clear();
    }
    subscribe(eventName, handler, once) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        const sub = { handler, once };
        this.listeners.get(eventName).add(sub);
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
//# sourceMappingURL=event-bus.js.map