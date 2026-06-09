const loadedLanguages = new Set<string>();

const languageLoaders: Record<string, () => Promise<unknown>> = {
  json: () => import("monaco-editor/esm/vs/language/json/monaco.contribution.js"),
  typescript: () => import("monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js"),
  javascript: () => import("monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js"),
  css: () => import("monaco-editor/esm/vs/basic-languages/css/css.contribution.js"),
  html: () => import("monaco-editor/esm/vs/basic-languages/html/html.contribution.js"),
  markdown: () => import("monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js"),
  yaml: () => import("monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js"),
  python: () => import("monaco-editor/esm/vs/basic-languages/python/python.contribution.js"),
  rust: () => import("monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js"),
  shell: () => import("monaco-editor/esm/vs/basic-languages/shell/shell.contribution.js"),
  xml: () => import("monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js"),
  ini: () => import("monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js"),
  dockerfile: () => import("monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js"),
  sql: () => import("monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js"),
  graphql: () => import("monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js"),
  go: () => import("monaco-editor/esm/vs/basic-languages/go/go.contribution.js"),
  java: () => import("monaco-editor/esm/vs/basic-languages/java/java.contribution.js"),
  csharp: () => import("monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js"),
  cpp: () => import("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js"),
  ruby: () => import("monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution.js"),
  php: () => import("monaco-editor/esm/vs/basic-languages/php/php.contribution.js"),
  swift: () => import("monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js"),
  kotlin: () => import("monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution.js"),
  scala: () => import("monaco-editor/esm/vs/basic-languages/scala/scala.contribution.js"),
  lua: () => import("monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js"),
  perl: () => import("monaco-editor/esm/vs/basic-languages/perl/perl.contribution.js"),
  r: () => import("monaco-editor/esm/vs/basic-languages/r/r.contribution.js"),
  objectivec: () => import("monaco-editor/esm/vs/basic-languages/objective-c/objective-c.contribution.js"),
  scss: () => import("monaco-editor/esm/vs/basic-languages/scss/scss.contribution.js"),
  less: () => import("monaco-editor/esm/vs/basic-languages/less/less.contribution.js"),
  handlebars: () => import("monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution.js"),
  pug: () => import("monaco-editor/esm/vs/basic-languages/pug/pug.contribution.js"),
};

/**
 * Load common Monaco language contributions on demand.
 * Kept behind the editor lazy boundary so startup stays shell-first.
 */
export async function loadMonacoLanguageContributions(): Promise<void> {
  await Promise.all(Object.keys(languageLoaders).map((languageId) => loadMonacoLanguage(languageId)));
}

export async function loadMonacoLanguage(languageId: string): Promise<void> {
  if (!languageId || loadedLanguages.has(languageId)) return;
  const loader = languageLoaders[languageId];
  if (!loader) return;
  loadedLanguages.add(languageId);
  await loader();
}

export async function loadMonacoLanguageForFile(languageId: string): Promise<void> {
  await loadMonacoLanguage(languageId);
}
