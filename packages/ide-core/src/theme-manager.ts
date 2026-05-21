/**
 * Theme Manager — handles theme registration, switching, and cache.
 * Supports VS Code-compatible theme format basics.
 */

export interface ThemeDefinition {
  id: string;
  label: string;
  type: "light" | "dark" | "high-contrast";
  colors: Record<string, string>;
  tokenColors?: TokenColorRule[];
}

export interface TokenColorRule {
  scope: string | string[];
  settings: {
    foreground?: string;
    fontStyle?: string;
  };
}

export type ThemeChangeListener = (theme: ThemeDefinition) => void;

const DEFAULT_DARK_THEME: ThemeDefinition = {
  id: "ide-dark",
  label: "Dark (Default)",
  type: "dark",
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "sideBar.background": "#252526",
    "sideBar.foreground": "#cccccc",
    "statusBar.background": "#007acc",
    "statusBar.foreground": "#ffffff",
    "terminal.background": "#1e1e1e",
    "terminal.foreground": "#cccccc",
    "panel.background": "#1e1e1e",
    "activityBar.background": "#333333",
    "titleBar.activeBackground": "#323233",
    "input.background": "#3c3c3c",
    "input.foreground": "#cccccc",
    "button.background": "#0e639c",
    "button.foreground": "#ffffff",
    "dropdown.background": "#3c3c3c",
    "list.activeSelectionBackground": "#094771",
    "scrollbarSlider.background": "#79797966",
    "badge.background": "#4d4d4d",
  },
  tokenColors: [
    {
      scope: "comment",
      settings: { foreground: "#6a9955", fontStyle: "italic" },
    },
    { scope: "keyword", settings: { foreground: "#569cd6" } },
    { scope: "string", settings: { foreground: "#ce9178" } },
    { scope: "number", settings: { foreground: "#b5cea8" } },
    { scope: "function", settings: { foreground: "#dcdcaa" } },
    { scope: "variable", settings: { foreground: "#9cdcfe" } },
    { scope: "type", settings: { foreground: "#4ec9b0" } },
  ],
};

const DEFAULT_LIGHT_THEME: ThemeDefinition = {
  id: "ide-light",
  label: "Light (Default)",
  type: "light",
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#333333",
    "sideBar.background": "#f3f3f3",
    "sideBar.foreground": "#333333",
    "statusBar.background": "#007acc",
    "statusBar.foreground": "#ffffff",
    "terminal.background": "#ffffff",
    "terminal.foreground": "#333333",
    "panel.background": "#f3f3f3",
    "activityBar.background": "#2c2c2c",
    "titleBar.activeBackground": "#dddddd",
    "input.background": "#ffffff",
    "input.foreground": "#333333",
    "button.background": "#0e639c",
    "button.foreground": "#ffffff",
    "dropdown.background": "#ffffff",
    "list.activeSelectionBackground": "#094771",
    "scrollbarSlider.background": "#64646466",
    "badge.background": "#c4c4c4",
  },
  tokenColors: [
    {
      scope: "comment",
      settings: { foreground: "#008000", fontStyle: "italic" },
    },
    { scope: "keyword", settings: { foreground: "#0000ff" } },
    { scope: "string", settings: { foreground: "#a31515" } },
    { scope: "number", settings: { foreground: "#098658" } },
    { scope: "function", settings: { foreground: "#795e26" } },
    { scope: "variable", settings: { foreground: "#001080" } },
    { scope: "type", settings: { foreground: "#267f99" } },
  ],
};

export class ThemeManager {
  private themes: Map<string, ThemeDefinition> = new Map();
  private activeThemeId: string = "ide-dark";
  private listeners: ThemeChangeListener[] = [];

  constructor() {
    this.registerTheme(DEFAULT_DARK_THEME);
    this.registerTheme(DEFAULT_LIGHT_THEME);
  }

  registerTheme(theme: ThemeDefinition): void {
    this.themes.set(theme.id, theme);
  }

  setActiveTheme(themeId: string): void {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme '${themeId}' not found`);
    }
    this.activeThemeId = themeId;
    const theme = this.themes.get(themeId)!;
    this.applyThemeToDOM(theme);
    for (const listener of this.listeners) {
      listener(theme);
    }
  }

  getActiveTheme(): ThemeDefinition {
    return this.themes.get(this.activeThemeId)!;
  }

  getTheme(themeId: string): ThemeDefinition | undefined {
    return this.themes.get(themeId);
  }

  listThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  onThemeChange(listener: ThemeChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  getColor(key: string): string {
    const theme = this.getActiveTheme();
    return theme.colors[key] ?? "";
  }

  /** Apply theme colors as CSS custom properties on document root. */
  private applyThemeToDOM(theme: ThemeDefinition): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.colors)) {
      const cssVar = `--${key.replace(/\./g, "-")}`;
      root.style.setProperty(cssVar, value);
    }
    root.setAttribute("data-theme", theme.type);
  }

  /** Initialize DOM with current theme (call on app startup). */
  initializeDOM(): void {
    this.applyThemeToDOM(this.getActiveTheme());
  }

  toJSON(): { activeThemeId: string } {
    return { activeThemeId: this.activeThemeId };
  }

  fromJSON(data: { activeThemeId: string }): void {
    if (this.themes.has(data.activeThemeId)) {
      this.activeThemeId = data.activeThemeId;
    }
  }
}
