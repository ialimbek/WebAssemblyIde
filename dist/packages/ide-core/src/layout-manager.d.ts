import type { Disposable } from "@webassembly-ide/shared";
/** Configuration for the Layout Manager */
export interface LayoutManagerConfig {
    /** Default sidebar width in pixels */
    defaultSidebarWidth?: number;
    /** Default bottom panel height in pixels */
    defaultBottomPanelHeight?: number;
}
/** Layout regions */
export type LayoutRegion = "sidebar" | "editor" | "bottomPanel" | "rightPanel";
/** Layout state */
interface LayoutState {
    sidebarWidth: number;
    bottomPanelHeight: number;
    rightPanelWidth: number;
    sidebarVisible: boolean;
    bottomPanelVisible: boolean;
    rightPanelVisible: boolean;
}
/**
 * Layout Manager — manages IDE shell layout dimensions and visibility.
 *
 * Tracks sidebar/bottom panel/right panel sizes and visibility.
 * Panels and UI components read layout state to render correctly.
 */
export declare class LayoutManager {
    private state;
    private listeners;
    constructor(config?: LayoutManagerConfig);
    /** Get current layout state */
    getState(): Readonly<LayoutState>;
    /** Set sidebar width */
    setSidebarWidth(width: number): void;
    /** Set bottom panel height */
    setBottomPanelHeight(height: number): void;
    /** Toggle sidebar visibility */
    toggleSidebar(): void;
    /** Toggle bottom panel visibility */
    toggleBottomPanel(): void;
    /** Toggle right panel visibility */
    toggleRightPanel(): void;
    /** Set visibility for a region */
    setRegionVisible(region: LayoutRegion, visible: boolean): void;
    /** Listen for layout changes */
    onChange(listener: (state: LayoutState) => void): Disposable;
    /** Dispose */
    dispose(): void;
    private notifyListeners;
}
export {};
//# sourceMappingURL=layout-manager.d.ts.map