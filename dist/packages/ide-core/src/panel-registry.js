/**
 * Panel Registry — manages IDE panels (explorer, terminal, agent, etc.)
 *
 * Panels register themselves and are placed into layout slots.
 * The Layout Manager reads the registry to render the shell.
 */
export class PanelRegistry {
    panels = new Map();
    listeners = new Set();
    /** Register a panel */
    register(definition) {
        const entry = {
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
    toggle(panelId) {
        const entry = this.panels.get(panelId);
        if (!entry)
            return;
        entry.state = entry.state === "visible" ? "hidden" : "visible";
        this.notifyListeners(panelId, entry.state);
    }
    /** Show a panel */
    show(panelId) {
        const entry = this.panels.get(panelId);
        if (!entry)
            return;
        entry.state = "visible";
        this.notifyListeners(panelId, entry.state);
    }
    /** Hide a panel */
    hide(panelId) {
        const entry = this.panels.get(panelId);
        if (!entry)
            return;
        entry.state = "hidden";
        this.notifyListeners(panelId, entry.state);
    }
    /** Get panel state */
    getState(panelId) {
        return this.panels.get(panelId)?.state;
    }
    /** Get all panels for a specific slot */
    getPanelsBySlot(slot) {
        return Array.from(this.panels.values())
            .filter((entry) => entry.definition.slot === slot && entry.state === "visible")
            .sort((a, b) => (a.definition.priority ?? 0) - (b.definition.priority ?? 0))
            .map((entry) => entry.definition);
    }
    /** Get all registered panel IDs */
    getAllIds() {
        return Array.from(this.panels.keys());
    }
    /** Listen for panel state changes */
    onChange(listener) {
        this.listeners.add(listener);
        return {
            dispose: () => {
                this.listeners.delete(listener);
            },
        };
    }
    /** Dispose */
    dispose() {
        this.panels.clear();
        this.listeners.clear();
    }
    notifyListeners(panelId, state) {
        for (const listener of this.listeners) {
            try {
                listener(panelId, state);
            }
            catch (error) {
                console.error("[PanelRegistry] Error in listener:", error);
            }
        }
    }
}
//# sourceMappingURL=panel-registry.js.map