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
    import("monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/go/go.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/java/java.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/php/php.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/scala/scala.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/perl/perl.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/r/r.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/objective-c/objective-c.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/scss/scss.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/less/less.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution.js"),
    import("monaco-editor/esm/vs/basic-languages/pug/pug.contribution.js"),
  ]);

  languageContributionsLoaded = true;
}
