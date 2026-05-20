/**
 * Command Bus — routes commands to registered handlers.
 *
 * Commands represent user intent or agent actions.
 * Each command has a unique string ID and a handler function.
 *
 * Usage:
 *   const bus = new CommandBus();
 *   bus.register("editor.save", (payload, ctx) => { ... });
 *   await bus.execute("editor.save", { filePath: "..." });
 */
export class CommandBus {
    handlers = new Map();
    config;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Register a command handler
     */
    register(commandId, handler, description) {
        if (this.handlers.has(commandId)) {
            if (this.config.debug) {
                console.warn(`[CommandBus] Overwriting existing handler for "${commandId}"`);
            }
        }
        this.handlers.set(commandId, {
            handler: handler,
            description,
        });
        return {
            dispose: () => {
                this.handlers.delete(commandId);
            },
        };
    }
    /**
     * Execute a command by its ID
     */
    async execute(commandId, payload, source = "unknown") {
        const entry = this.handlers.get(commandId);
        if (!entry) {
            if (this.config.debug) {
                console.warn(`[CommandBus] No handler registered for "${commandId}"`);
            }
            return;
        }
        const context = {
            source,
            timestamp: Date.now(),
        };
        if (this.config.debug) {
            console.debug(`[CommandBus] Executing "${commandId}" from "${source}"`);
        }
        await entry.handler(payload, context);
    }
    /**
     * Check if a command has a registered handler
     */
    has(commandId) {
        return this.handlers.has(commandId);
    }
    /**
     * Get all registered command IDs
     */
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Dispose all registrations
     */
    dispose() {
        this.handlers.clear();
    }
}
//# sourceMappingURL=command-bus.js.map