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

const SOLARIZED_DARK_THEME: ThemeDefinition = {
  id: "solarized-dark",
  label: "Solarized Dark",
  type: "dark",
  colors: {
    "editor.background": "#002b36",
    "editor.foreground": "#839496",
    "sideBar.background": "#073642",
    "sideBar.foreground": "#839496",
    "statusBar.background": "#073642",
    "statusBar.foreground": "#93a1a1",
    "terminal.background": "#002b36",
    "terminal.foreground": "#839496",
    "panel.background": "#002b36",
    "activityBar.background": "#073642",
    "titleBar.activeBackground": "#073642",
    "input.background": "#073642",
    "input.foreground": "#839496",
    "button.background": "#268bd2",
    "button.foreground": "#fdf6e3",
    "dropdown.background": "#073642",
    "list.activeSelectionBackground": "#268bd2",
    "scrollbarSlider.background": "#586e7566",
    "badge.background": "#586e75",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#586e75", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#859900" } },
    { scope: "string", settings: { foreground: "#2aa198" } },
    { scope: "number", settings: { foreground: "#d33682" } },
    { scope: "function", settings: { foreground: "#268bd2" } },
    { scope: "variable", settings: { foreground: "#b58900" } },
    { scope: "type", settings: { foreground: "#cb4b16" } },
  ],
};

const SOLARIZED_LIGHT_THEME: ThemeDefinition = {
  id: "solarized-light",
  label: "Solarized Light",
  type: "light",
  colors: {
    "editor.background": "#fdf6e3",
    "editor.foreground": "#657b83",
    "sideBar.background": "#eee8d5",
    "sideBar.foreground": "#657b83",
    "statusBar.background": "#eee8d5",
    "statusBar.foreground": "#586e75",
    "terminal.background": "#fdf6e3",
    "terminal.foreground": "#657b83",
    "panel.background": "#fdf6e3",
    "activityBar.background": "#eee8d5",
    "titleBar.activeBackground": "#eee8d5",
    "input.background": "#fdf6e3",
    "input.foreground": "#657b83",
    "button.background": "#268bd2",
    "button.foreground": "#fdf6e3",
    "dropdown.background": "#eee8d5",
    "list.activeSelectionBackground": "#268bd2",
    "scrollbarSlider.background": "#93a1a166",
    "badge.background": "#93a1a1",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#93a1a1", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#859900" } },
    { scope: "string", settings: { foreground: "#2aa198" } },
    { scope: "number", settings: { foreground: "#d33682" } },
    { scope: "function", settings: { foreground: "#268bd2" } },
    { scope: "variable", settings: { foreground: "#b58900" } },
    { scope: "type", settings: { foreground: "#cb4b16" } },
  ],
};

const MONOKAI_THEME: ThemeDefinition = {
  id: "monokai",
  label: "Monokai",
  type: "dark",
  colors: {
    "editor.background": "#272822",
    "editor.foreground": "#f8f8f2",
    "sideBar.background": "#1e1f1c",
    "sideBar.foreground": "#f8f8f2",
    "statusBar.background": "#1e1f1c",
    "statusBar.foreground": "#f8f8f2",
    "terminal.background": "#272822",
    "terminal.foreground": "#f8f8f2",
    "panel.background": "#272822",
    "activityBar.background": "#1e1f1c",
    "titleBar.activeBackground": "#1e1f1c",
    "input.background": "#3e3d32",
    "input.foreground": "#f8f8f2",
    "button.background": "#a6e22e",
    "button.foreground": "#272822",
    "dropdown.background": "#3e3d32",
    "list.activeSelectionBackground": "#49483e",
    "scrollbarSlider.background": "#75715e66",
    "badge.background": "#75715e",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#75715e", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#f92672" } },
    { scope: "string", settings: { foreground: "#e6db74" } },
    { scope: "number", settings: { foreground: "#ae81ff" } },
    { scope: "function", settings: { foreground: "#a6e22e" } },
    { scope: "variable", settings: { foreground: "#f8f8f2" } },
    { scope: "type", settings: { foreground: "#66d9ef", fontStyle: "italic" } },
  ],
};

const DRACULA_THEME: ThemeDefinition = {
  id: "dracula",
  label: "Dracula",
  type: "dark",
  colors: {
    "editor.background": "#282a36",
    "editor.foreground": "#f8f8f2",
    "sideBar.background": "#21222c",
    "sideBar.foreground": "#f8f8f2",
    "statusBar.background": "#21222c",
    "statusBar.foreground": "#f8f8f2",
    "terminal.background": "#282a36",
    "terminal.foreground": "#f8f8f2",
    "panel.background": "#282a36",
    "activityBar.background": "#21222c",
    "titleBar.activeBackground": "#21222c",
    "input.background": "#44475a",
    "input.foreground": "#f8f8f2",
    "button.background": "#bd93f9",
    "button.foreground": "#282a36",
    "dropdown.background": "#44475a",
    "list.activeSelectionBackground": "#44475a",
    "scrollbarSlider.background": "#6272a466",
    "badge.background": "#6272a4",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#6272a4", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#ff79c6" } },
    { scope: "string", settings: { foreground: "#f1fa8c" } },
    { scope: "number", settings: { foreground: "#bd93f9" } },
    { scope: "function", settings: { foreground: "#50fa7b" } },
    { scope: "variable", settings: { foreground: "#f8f8f2" } },
    { scope: "type", settings: { foreground: "#8be9fd", fontStyle: "italic" } },
  ],
};

const NORD_THEME: ThemeDefinition = {
  id: "nord",
  label: "Nord",
  type: "dark",
  colors: {
    "editor.background": "#2e3440",
    "editor.foreground": "#d8dee9",
    "sideBar.background": "#3b4252",
    "sideBar.foreground": "#d8dee9",
    "statusBar.background": "#3b4252",
    "statusBar.foreground": "#d8dee9",
    "terminal.background": "#2e3440",
    "terminal.foreground": "#d8dee9",
    "panel.background": "#2e3440",
    "activityBar.background": "#3b4252",
    "titleBar.activeBackground": "#3b4252",
    "input.background": "#3b4252",
    "input.foreground": "#d8dee9",
    "button.background": "#5e81ac",
    "button.foreground": "#eceff4",
    "dropdown.background": "#3b4252",
    "list.activeSelectionBackground": "#434c5e",
    "scrollbarSlider.background": "#4c566a66",
    "badge.background": "#4c566a",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#616e88", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#81a1c1" } },
    { scope: "string", settings: { foreground: "#a3be8c" } },
    { scope: "number", settings: { foreground: "#b48ead" } },
    { scope: "function", settings: { foreground: "#88c0d0" } },
    { scope: "variable", settings: { foreground: "#d8dee9" } },
    { scope: "type", settings: { foreground: "#8fbcbb" } },
  ],
};

const GRUVBOX_DARK_THEME: ThemeDefinition = {
  id: "gruvbox-dark",
  label: "Gruvbox Dark",
  type: "dark",
  colors: {
    "editor.background": "#282828",
    "editor.foreground": "#ebdbb2",
    "sideBar.background": "#3c3836",
    "sideBar.foreground": "#ebdbb2",
    "statusBar.background": "#3c3836",
    "statusBar.foreground": "#ebdbb2",
    "terminal.background": "#282828",
    "terminal.foreground": "#ebdbb2",
    "panel.background": "#282828",
    "activityBar.background": "#3c3836",
    "titleBar.activeBackground": "#3c3836",
    "input.background": "#3c3836",
    "input.foreground": "#ebdbb2",
    "button.background": "#b8bb26",
    "button.foreground": "#282828",
    "dropdown.background": "#3c3836",
    "list.activeSelectionBackground": "#504945",
    "scrollbarSlider.background": "#665c5466",
    "badge.background": "#665c54",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#928374", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#fb4934" } },
    { scope: "string", settings: { foreground: "#b8bb26" } },
    { scope: "number", settings: { foreground: "#d3869b" } },
    { scope: "function", settings: { foreground: "#fabd2f" } },
    { scope: "variable", settings: { foreground: "#ebdbb2" } },
    { scope: "type", settings: { foreground: "#83a598" } },
  ],
};

const TOKYO_NIGHT_THEME: ThemeDefinition = {
  id: "tokyo-night",
  label: "Tokyo Night",
  type: "dark",
  colors: {
    "editor.background": "#1a1b26",
    "editor.foreground": "#c0caf5",
    "sideBar.background": "#16161e",
    "sideBar.foreground": "#c0caf5",
    "statusBar.background": "#16161e",
    "statusBar.foreground": "#c0caf5",
    "terminal.background": "#1a1b26",
    "terminal.foreground": "#c0caf5",
    "panel.background": "#1a1b26",
    "activityBar.background": "#16161e",
    "titleBar.activeBackground": "#16161e",
    "input.background": "#24283b",
    "input.foreground": "#c0caf5",
    "button.background": "#7aa2f7",
    "button.foreground": "#1a1b26",
    "dropdown.background": "#24283b",
    "list.activeSelectionBackground": "#33467c",
    "scrollbarSlider.background": "#565f8966",
    "badge.background": "#565f89",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#565f89", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#bb9af7" } },
    { scope: "string", settings: { foreground: "#9ece6a" } },
    { scope: "number", settings: { foreground: "#ff9e64" } },
    { scope: "function", settings: { foreground: "#7aa2f7" } },
    { scope: "variable", settings: { foreground: "#c0caf5" } },
    { scope: "type", settings: { foreground: "#2ac3de" } },
  ],
};

const HIGH_CONTRAST_THEME: ThemeDefinition = {
  id: "high-contrast",
  label: "High Contrast",
  type: "high-contrast",
  colors: {
    "editor.background": "#000000",
    "editor.foreground": "#ffffff",
    "sideBar.background": "#000000",
    "sideBar.foreground": "#ffffff",
    "statusBar.background": "#000000",
    "statusBar.foreground": "#ffffff",
    "terminal.background": "#000000",
    "terminal.foreground": "#ffffff",
    "panel.background": "#000000",
    "activityBar.background": "#000000",
    "titleBar.activeBackground": "#000000",
    "input.background": "#1a1a1a",
    "input.foreground": "#ffffff",
    "button.background": "#0078d4",
    "button.foreground": "#ffffff",
    "dropdown.background": "#1a1a1a",
    "list.activeSelectionBackground": "#0078d4",
    "scrollbarSlider.background": "#ffffff66",
    "badge.background": "#0078d4",
  },
  tokenColors: [
    { scope: "comment", settings: { foreground: "#7ca668", fontStyle: "italic" } },
    { scope: "keyword", settings: { foreground: "#569cd6" } },
    { scope: "string", settings: { foreground: "#ce9178" } },
    { scope: "number", settings: { foreground: "#b5cea8" } },
    { scope: "function", settings: { foreground: "#dcdcaa" } },
    { scope: "variable", settings: { foreground: "#9cdcfe" } },
    { scope: "type", settings: { foreground: "#4ec9b0" } },
  ],
};

export class ThemeManager {
  private themes: Map<string, ThemeDefinition> = new Map();
  private activeThemeId: string = "ide-dark";
  private listeners: ThemeChangeListener[] = [];

  constructor() {
    this.registerTheme(DEFAULT_DARK_THEME);
    this.registerTheme(DEFAULT_LIGHT_THEME);
    this.registerTheme(SOLARIZED_DARK_THEME);
    this.registerTheme(SOLARIZED_LIGHT_THEME);
    this.registerTheme(MONOKAI_THEME);
    this.registerTheme(DRACULA_THEME);
    this.registerTheme(NORD_THEME);
    this.registerTheme(GRUVBOX_DARK_THEME);
    this.registerTheme(TOKYO_NIGHT_THEME);
    this.registerTheme(HIGH_CONTRAST_THEME);
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
