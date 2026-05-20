import type { Disposable } from "@webassembly-ide/shared";
import type React from "react";

/** Slot where a panel can be placed */
export type PanelSlot = "sidebar" | "editor" | "bottom" | "right";

/** State of a registered panel */
export type PanelState = "hidden" | "visible" | "minimized";

/** Definition of a panel */
export interface PanelDefinition {
  id: string;
  title: string;
  slot: PanelSlot;
  /** React component to render */
  component: React.ComponentType;
  /** Icon identifier */
  icon?: string;
  /** Panel priority for ordering */
  priority?: number;
  /** Whether panel starts visible */
  defaultVisible?: boolean;
}

/** Internal panel entry */
interface PanelEntry {
  definition: PanelDefinition;
  state: PanelState;
}

/**
 * Panel Registry — manages IDE panels (explorer, terminal, agent, etc.)
 *
 * Panels register themselves and are placed into layout slots.
 * The Layout Manager reads the registry to render the shell.
 */
export class PanelRegistry {
  private panels = new Map<string, PanelEntry>();
  private listeners = new Set<(panelId: string, state: PanelState) => void>();

  /** Register a panel */
  register(definition: PanelDefinition): Disposable {
    const entry: PanelEntry = {
      definition,
      state: definition.defaultVisible !== false ? "visible" : "hidden",
    };
    this.panels.set(definition.id, entry);
    this.notifyListeners(definition.id, entry.state);

    return {
      dispose: () => {
        this.panels.delete(definition.id);
      },
    };
  }

  /** Toggle panel visibility */
  toggle(panelId: string): void {
    const entry = this.panels.get(panelId);
    if (!entry) return;
    entry.state = entry.state === "visible" ? "hidden" : "visible";
    this.notifyListeners(panelId, entry.state);
  }

  /** Show a panel */
  show(panelId: string): void {
    const entry = this.panels.get(panelId);
    if (!entry) return;
    entry.state = "visible";
    this.notifyListeners(panelId, entry.state);
  }

  /** Hide a panel */
  hide(panelId: string): void {
    const entry = this.panels.get(panelId);
    if (!entry) return;
    entry.state = "hidden";
    this.notifyListeners(panelId, entry.state);
  }

  /** Get panel state */
  getState(panelId: string): PanelState | undefined {
    return this.panels.get(panelId)?.state;
  }

  /** Get all panels for a specific slot */
  getPanelsBySlot(slot: PanelSlot): PanelDefinition[] {
    return Array.from(this.panels.values())
      .filter(
        (entry) => entry.definition.slot === slot && entry.state === "visible",
      )
      .sort(
        (a, b) => (a.definition.priority ?? 0) - (b.definition.priority ?? 0),
      )
      .map((entry) => entry.definition);
  }

  /** Get all registered panel IDs */
  getAllIds(): string[] {
    return Array.from(this.panels.keys());
  }

  /** Listen for panel state changes */
  onChange(listener: (panelId: string, state: PanelState) => void): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Dispose */
  dispose(): void {
    this.panels.clear();
    this.listeners.clear();
  }

  private notifyListeners(panelId: string, state: PanelState): void {
    for (const listener of this.listeners) {
      try {
        listener(panelId, state);
      } catch (error) {
        console.error("[PanelRegistry] Error in listener:", error);
      }
    }
  }
}
