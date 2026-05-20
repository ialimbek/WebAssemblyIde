import type { Disposable } from "@webassembly-ide/shared";
/** Configuration for the Command Bus */
export interface CommandBusConfig {
    /** Enable debug logging */
    debug?: boolean;
}
/** Command execution context */
export interface CommandContext {
    /** Source of the command (e.g., "user", "agent", "keyboard") */
    source: string;
    /** Timestamp when command was issued */
    timestamp: number;
}
/** Command handler function */
export type CommandHandler<TPayload = void> = (payload: TPayload, context: CommandContext) => void | Promise<void>;
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
export declare class CommandBus {
    private handlers;
    private config;
    constructor(config?: CommandBusConfig);
    /**
     * Register a command handler
     */
    register<TPayload = void>(commandId: string, handler: CommandHandler<TPayload>, description?: string): Disposable;
    /**
     * Execute a command by its ID
     */
    execute<TPayload = void>(commandId: string, payload?: TPayload, source?: string): Promise<void>;
    /**
     * Check if a command has a registered handler
     */
    has(commandId: string): boolean;
    /**
     * Get all registered command IDs
     */
    getRegisteredCommands(): string[];
    /**
     * Dispose all registrations
     */
    dispose(): void;
}
//# sourceMappingURL=command-bus.d.ts.map