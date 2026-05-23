/**
 * @webassembly-ide/accessibility
 *
 * Accessibility utilities targeting WCAG 2.1 AA: screen-reader announcer,
 * focus management, reduced motion / high contrast preferences, and an
 * AccessibilityManager that wires everything together.
 *
 * The module is dependency-free and gracefully no-ops when run in
 * environments without `document` (Node tests).
 */

export type Politeness = "polite" | "assertive";

export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
}

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderMode: false,
};

const STORAGE_KEY = "ide.accessibility.preferences";

export type PreferencesListener = (prefs: AccessibilityPreferences) => void;

/**
 * Manages accessibility preferences. Persists to `localStorage` when
 * available, and applies state to the document root via CSS custom
 * properties and data attributes so styles can react.
 */
export class AccessibilityManager {
  private prefs: AccessibilityPreferences;
  private listeners = new Set<PreferencesListener>();
  private announcer: ScreenReaderAnnouncer | null = null;
  private mediaListeners: Array<() => void> = [];

  constructor(initial?: Partial<AccessibilityPreferences>) {
    this.prefs = { ...DEFAULT_PREFERENCES, ...this.loadPersisted(), ...initial };
    this.bindToMediaQueries();
    this.apply();
  }

  /** Current preferences (shallow copy). */
  getPreferences(): AccessibilityPreferences {
    return { ...this.prefs };
  }

  /** Patch one or more preferences. */
  updatePreferences(patch: Partial<AccessibilityPreferences>): void {
    const next = { ...this.prefs, ...patch };
    if (shallowEqual(next, this.prefs)) return;
    this.prefs = next;
    this.persist();
    this.apply();
    for (const listener of this.listeners) {
      try {
        listener(this.getPreferences());
      } catch {
        /* ignore */
      }
    }
  }

  onChange(listener: PreferencesListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Announce a message to assistive tech using a polite or assertive
   * ARIA live region. The region is reused across announcements.
   */
  announce(message: string, politeness: Politeness = "polite"): void {
    if (typeof document === "undefined") return;
    if (!this.announcer) this.announcer = new ScreenReaderAnnouncer();
    this.announcer.announce(message, politeness);
  }

  /** Release listeners and detached DOM. */
  dispose(): void {
    for (const off of this.mediaListeners) {
      try {
        off();
      } catch {
        /* ignore */
      }
    }
    this.mediaListeners = [];
    this.listeners.clear();
    this.announcer?.dispose();
    this.announcer = null;
  }

  private apply(): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset["reducedMotion"] = this.prefs.reducedMotion ? "1" : "0";
    root.dataset["highContrast"] = this.prefs.highContrast ? "1" : "0";
    root.dataset["largeText"] = this.prefs.largeText ? "1" : "0";
    root.dataset["screenReaderMode"] = this.prefs.screenReaderMode ? "1" : "0";

    root.style.setProperty(
      "--motion-duration",
      this.prefs.reducedMotion ? "0ms" : "180ms",
    );
    root.style.setProperty(
      "--motion-easing",
      this.prefs.reducedMotion ? "linear" : "cubic-bezier(.2,.8,.2,1)",
    );
    root.style.setProperty(
      "--font-scale",
      this.prefs.largeText ? "1.15" : "1",
    );
    root.style.setProperty(
      "--contrast-level",
      this.prefs.highContrast ? "high" : "default",
    );
  }

  private bindToMediaQueries(): void {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = window.matchMedia("(prefers-contrast: more)");

    const motionHandler = () => {
      if (motion.matches) this.updatePreferences({ reducedMotion: true });
    };
    const contrastHandler = () => {
      if (contrast.matches) this.updatePreferences({ highContrast: true });
    };
    motionHandler();
    contrastHandler();

    motion.addEventListener("change", motionHandler);
    contrast.addEventListener("change", contrastHandler);
    this.mediaListeners.push(() =>
      motion.removeEventListener("change", motionHandler),
    );
    this.mediaListeners.push(() =>
      contrast.removeEventListener("change", contrastHandler),
    );
  }

  private loadPersisted(): Partial<AccessibilityPreferences> {
    if (typeof localStorage === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Partial<AccessibilityPreferences>) : {};
    } catch {
      return {};
    }
  }

  private persist(): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch {
      /* ignore quota / privacy mode errors */
    }
  }
}

/**
 * Lightweight ARIA live-region announcer.
 */
export class ScreenReaderAnnouncer {
  private polite: HTMLElement;
  private assertive: HTMLElement;

  constructor() {
    this.polite = createLiveRegion("polite");
    this.assertive = createLiveRegion("assertive");
  }

  announce(message: string, politeness: Politeness = "polite"): void {
    const target = politeness === "assertive" ? this.assertive : this.polite;
    // Clear and reset so duplicate announcements still fire.
    target.textContent = "";
    requestAnimationFrameSafe(() => {
      target.textContent = message;
    });
  }

  dispose(): void {
    this.polite.remove();
    this.assertive.remove();
  }
}

/**
 * Constrain keyboard focus to a container element. Returns a function
 * which removes the trap. Optional `initialFocus` will receive focus on
 * activation (defaults to the first focusable node).
 */
export function trapFocus(
  container: HTMLElement,
  initialFocus?: HTMLElement | null,
): () => void {
  if (typeof document === "undefined") return () => undefined;
  const focusable = () => getFocusableElements(container);

  const previousFocus = document.activeElement as HTMLElement | null;
  const focusables = focusable();
  (initialFocus ?? focusables[0] ?? container).focus();

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const list = focusable();
    if (list.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);

  return () => {
    container.removeEventListener("keydown", onKeyDown);
    previousFocus?.focus?.();
  };
}

/** Return a list of tabbable descendants of `container`. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (typeof container.querySelectorAll !== "function") return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex=\"-1\"])",
    ].join(","),
  );
  return Array.from(nodes).filter(isVisible);
}

function isVisible(el: HTMLElement): boolean {
  return (
    el.offsetWidth > 0 ||
    el.offsetHeight > 0 ||
    el === document.activeElement
  );
}

function createLiveRegion(politeness: Politeness): HTMLElement {
  const region = document.createElement("div");
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", politeness);
  region.setAttribute("aria-atomic", "true");
  region.style.position = "absolute";
  region.style.width = "1px";
  region.style.height = "1px";
  region.style.overflow = "hidden";
  region.style.clip = "rect(0 0 0 0)";
  region.style.whiteSpace = "nowrap";
  document.body.appendChild(region);
  return region;
}

function shallowEqual(a: AccessibilityPreferences, b: AccessibilityPreferences): boolean {
  return (
    a.reducedMotion === b.reducedMotion &&
    a.highContrast === b.highContrast &&
    a.largeText === b.largeText &&
    a.screenReaderMode === b.screenReaderMode
  );
}

function requestAnimationFrameSafe(callback: FrameRequestCallback): void {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(callback);
  } else {
    setTimeout(() => callback(performance.now?.() ?? 0), 16);
  }
}
