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
export class LayoutManager {
  private state: LayoutState;
  private listeners = new Set<(state: LayoutState) => void>();

  constructor(config: LayoutManagerConfig = {}) {
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
  getState(): Readonly<LayoutState> {
    return this.state;
  }

  /** Set sidebar width */
  setSidebarWidth(width: number): void {
    this.state.sidebarWidth = Math.max(120, Math.min(600, width));
    this.notifyListeners();
  }

  /** Set bottom panel height */
  setBottomPanelHeight(height: number): void {
    this.state.bottomPanelHeight = Math.max(100, Math.min(500, height));
    this.notifyListeners();
  }

  /** Toggle sidebar visibility */
  toggleSidebar(): void {
    this.state.sidebarVisible = !this.state.sidebarVisible;
    this.notifyListeners();
  }

  /** Toggle bottom panel visibility */
  toggleBottomPanel(): void {
    this.state.bottomPanelVisible = !this.state.bottomPanelVisible;
    this.notifyListeners();
  }

  /** Toggle right panel visibility */
  toggleRightPanel(): void {
    this.state.rightPanelVisible = !this.state.rightPanelVisible;
    this.notifyListeners();
  }

  /** Set visibility for a region */
  setRegionVisible(region: LayoutRegion, visible: boolean): void {
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
  onChange(listener: (state: LayoutState) => void): Disposable {
    this.listeners.add(listener);
    return {
      dispose: () => {
        this.listeners.delete(listener);
      },
    };
  }

  /** Dispose */
  dispose(): void {
    this.listeners.clear();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error("[LayoutManager] Error in listener:", error);
      }
    }
  }
}
