/**
 * Layout Manager — manages IDE shell layout dimensions and visibility.
 *
 * Tracks sidebar/bottom panel/right panel sizes and visibility.
 * Panels and UI components read layout state to render correctly.
 */
export class LayoutManager {
    state;
    listeners = new Set();
    constructor(config = {}) {
        this.state = {
            sidebarWidth: config.defaultSidebarWidth ?? 240,
            bottomPanelHeight: config.defaultBottomPanelHeight ?? 200,
            rightPanelWidth: 300,
            sidebarVisible: true,
            bottomPanelVisible: true,
            rightPanelVisible: false,
        };
    }
    /** Get current layout state */
    getState() {
        return this.state;
    }
    /** Set sidebar width */
    setSidebarWidth(width) {
        this.state.sidebarWidth = Math.max(120, Math.min(600, width));
        this.notifyListeners();
    }
    /** Set bottom panel height */
    setBottomPanelHeight(height) {
        this.state.bottomPanelHeight = Math.max(100, Math.min(500, height));
        this.notifyListeners();
    }
    /** Toggle sidebar visibility */
    toggleSidebar() {
        this.state.sidebarVisible = !this.state.sidebarVisible;
        this.notifyListeners();
    }
    /** Toggle bottom panel visibility */
    toggleBottomPanel() {
        this.state.bottomPanelVisible = !this.state.bottomPanelVisible;
        this.notifyListeners();
    }
    /** Toggle right panel visibility */
    toggleRightPanel() {
        this.state.rightPanelVisible = !this.state.rightPanelVisible;
        this.notifyListeners();
    }
    /** Set visibility for a region */
    setRegionVisible(region, visible) {
        switch (region) {
            case "sidebar":
                this.state.sidebarVisible = visible;
                break;
            case "bottomPanel":
                this.state.bottomPanelVisible = visible;
                break;
            case "rightPanel":
                this.state.rightPanelVisible = visible;
                break;
        }
        this.notifyListeners();
    }
    /** Listen for layout changes */
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
        this.listeners.clear();
    }
    notifyListeners() {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            }
            catch (error) {
                console.error("[LayoutManager] Error in listener:", error);
            }
        }
    }
}
//# sourceMappingURL=layout-manager.js.map