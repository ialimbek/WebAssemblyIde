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
/**
 * Panel Registry — manages IDE panels (explorer, terminal, agent, etc.)
 *
 * Panels register themselves and are placed into layout slots.
 * The Layout Manager reads the registry to render the shell.
 */
export declare class PanelRegistry {
    private panels;
    private listeners;
    /** Register a panel */
    register(definition: PanelDefinition): Disposable;
    /** Toggle panel visibility */
    toggle(panelId: string): void;
    /** Show a panel */
    show(panelId: string): void;
    /** Hide a panel */
    hide(panelId: string): void;
    /** Get panel state */
    getState(panelId: string): PanelState | undefined;
    /** Get all panels for a specific slot */
    getPanelsBySlot(slot: PanelSlot): PanelDefinition[];
    /** Get all registered panel IDs */
    getAllIds(): string[];
    /** Listen for panel state changes */
    onChange(listener: (panelId: string, state: PanelState) => void): Disposable;
    /** Dispose */
    dispose(): void;
    private notifyListeners;
}
//# sourceMappingURL=panel-registry.d.ts.map