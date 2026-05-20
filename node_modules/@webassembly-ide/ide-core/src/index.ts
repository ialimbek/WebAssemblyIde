/**
 * @webassembly-ide/ide-core
 *
 * Core IDE runtime — Panel Registry and Layout Manager.
 */

// ─── Panel Registry ─────────────────────────────────────────────────────────
export {
  PanelRegistry,
  type PanelDefinition,
  type PanelState,
  type PanelSlot,
} from "./panel-registry.js";

// ─── Layout Manager ─────────────────────────────────────────────────────────
export {
  LayoutManager,
  type LayoutManagerConfig,
  type LayoutRegion,
} from "./layout-manager.js";
