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
export type CommandHandler<TPayload = void> = (
  payload: TPayload,
  context: CommandContext,
) => void | Promise<void>;

/** Command registration entry */
interface CommandEntry {
  handler: CommandHandler<unknown>;
  description?: string;
}

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
  private handlers = new Map<string, CommandEntry>();
  private config: CommandBusConfig;

  constructor(config: CommandBusConfig = {}) {
    this.config = config;
  }

  /**
   * Register a command handler
   */
  register<TPayload = void>(
    commandId: string,
    handler: CommandHandler<TPayload>,
    description?: string,
  ): Disposable {
    if (this.handlers.has(commandId)) {
      if (this.config.debug) {
        console.warn(
          `[CommandBus] Overwriting existing handler for "${commandId}"`,
        );
      }
    }

    this.handlers.set(commandId, {
      handler: handler as CommandHandler<unknown>,
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
  async execute<TPayload = void>(
    commandId: string,
    payload?: TPayload,
    source = "unknown",
  ): Promise<void> {
    const entry = this.handlers.get(commandId);

    if (!entry) {
      if (this.config.debug) {
        console.warn(`[CommandBus] No handler registered for "${commandId}"`);
      }
      return;
    }

    const context: CommandContext = {
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
  has(commandId: string): boolean {
    return this.handlers.has(commandId);
  }

  /**
   * Get all registered command IDs
   */
  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Dispose all registrations
   */
  dispose(): void {
    this.handlers.clear();
  }
}
