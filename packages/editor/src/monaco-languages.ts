let languageContributionsLoaded = false;

/**
 * Load common Monaco language contributions on demand.
 * Kept behind the editor lazy boundary so startup stays shell-first.
 */
export async function loadMonacoLanguageContributions(): Promise<void> {
  if (languageContributionsLoaded) return;

  await Promise.all([
    import("monaco-editor/esm/vs/language/json/monaco.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/css/css.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/html/html.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/python/python.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/shell/shell.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js"),
  ]);

  languageContributionsLoaded = true;
}
