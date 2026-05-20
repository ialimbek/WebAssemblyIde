/**
 * @webassembly-ide/command-bus
 *
 * Command Bus and Event Bus for loose-coupled module communication.
 * Modules communicate through commands (user intent) and events (state changes).
 */

// ─── Command Bus ────────────────────────────────────────────────────────────
export { CommandBus, type CommandBusConfig } from "./command-bus.js";

// ─── Event Bus ──────────────────────────────────────────────────────────────
export { EventBus, type EventBusConfig } from "./event-bus.js";
