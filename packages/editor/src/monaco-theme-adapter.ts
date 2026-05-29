import type { editor } from "monaco-editor";
import type { ThemeDefinition, TokenColorRule } from "@webassembly-ide/ide-core";

const TOKEN_SCOPE_TO_MONACO: Record<string, string[]> = {
  comment: ["comment"],
  keyword: ["keyword", "keyword.json", "delimiter", "tag"],
  string: ["string", "string.value.json"],
  number: ["number", "number.json"],
  function: ["function", "method", "support.function"],
  variable: ["variable", "identifier", "property", "attribute.name"],
  type: ["type", "class", "interface", "enum"],
};

function normalizeColor(value?: string): string | undefined {
  return value?.replace(/^#/, "");
}

function tokenRuleToMonaco(rule: TokenColorRule): editor.ITokenThemeRule[] {
  const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
  return scopes.flatMap((scope) => {
    const tokenNames = TOKEN_SCOPE_TO_MONACO[scope] ?? [scope];
    return tokenNames.map((token) => ({
      token,
      foreground: normalizeColor(rule.settings.foreground),
      fontStyle: rule.settings.fontStyle ?? "",
    }));
  });
}

export function toMonacoThemeData(
  theme: ThemeDefinition,
): editor.IStandaloneThemeData {
  const colors = theme.colors;
  return {
    base:
      theme.type === "light"
        ? "vs"
        : theme.type === "high-contrast"
          ? "hc-black"
          : "vs-dark",
    inherit: true,
    rules: [
      ...(theme.tokenColors?.flatMap(tokenRuleToMonaco) ?? []),
      {
        token: "string.key.json",
        foreground: normalizeColor(
          findTokenColor(theme.tokenColors, "variable") ?? "#9cdcfe",
        ),
      },
      {
        token: "delimiter.bracket.json",
        foreground: normalizeColor(colors["editor.foreground"]),
      },
      {
        token: "delimiter.array.json",
        foreground: normalizeColor(colors["editor.foreground"]),
      },
      {
        token: "delimiter.colon.json",
        foreground: normalizeColor(colors["editor.foreground"]),
      },
    ],
    colors: {
      "editor.background": colors["editor.background"],
      "editor.foreground": colors["editor.foreground"],
      "editorLineNumber.foreground": colors["editorLineNumber.foreground"] ?? colors["tab.inactiveForeground"],
      "editorLineNumber.activeForeground": colors["editor.foreground"],
      "editorCursor.foreground": colors["editorCursor.foreground"] ?? colors.focusBorder,
      "editor.selectionBackground": colors["selection.background"],
      "editor.inactiveSelectionBackground": colors["list.inactiveSelectionBackground"],
      "editor.lineHighlightBackground": colors["list.hoverBackground"],
      "editorWhitespace.foreground": colors["tab.inactiveForeground"],
      "editorIndentGuide.background1": colors["sideBar.border"],
      "editorIndentGuide.activeBackground1": colors.focusBorder,
      "editorGutter.background": colors["editor.background"],
      "editorWidget.background": colors["panel.background"],
      "editorWidget.foreground": colors["editor.foreground"],
      "editorSuggestWidget.background": colors["panel.background"],
      "editorSuggestWidget.foreground": colors["editor.foreground"],
      "editorSuggestWidget.selectedBackground": colors["list.activeSelectionBackground"],
      "editorHoverWidget.background": colors["panel.background"],
      "editorHoverWidget.border": colors["sideBar.border"],
      "diffEditor.insertedTextBackground": `${colors["button.background"] ?? "#2ea043"}33`,
      "diffEditor.removedTextBackground": "#f8514933",
      "diffEditor.insertedLineBackground": "#2ea04324",
      "diffEditor.removedLineBackground": "#f8514924",
      "diffEditorGutter.insertedLineBackground": "#2ea04366",
      "diffEditorGutter.removedLineBackground": "#f8514966",
    },
  };
}

function findTokenColor(
  rules: TokenColorRule[] | undefined,
  scope: string,
): string | undefined {
  return rules?.find((rule) => rule.scope === scope)?.settings.foreground;
}

export function defineMonacoTheme(
  monaco: typeof import("monaco-editor"),
  theme: ThemeDefinition,
): void {
  monaco.editor.defineTheme(theme.id, toMonacoThemeData(theme));
}
