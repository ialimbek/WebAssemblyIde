import { useEffect, useRef, useMemo } from "react";
import { marked } from "marked";

const GITHUB_CSS = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #c9d1d9;
    background: #0d1117;
    max-width: 900px;
    margin: 0 auto;
    padding: 32px;
  }
  h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.25; margin-top: 24px; margin-bottom: 16px; color: #f0f6fc; }
  h1 { font-size: 2em; border-bottom: 1px solid #21262d; padding-bottom: .3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #21262d; padding-bottom: .3em; }
  h3 { font-size: 1.25em; }
  p { margin-top: 0; margin-bottom: 16px; }
  a { color: #58a6ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { background: rgba(110, 118, 129, 0.4); padding: .2em .4em; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace; font-size: 85%; color: #c9d1d9; }
  pre { background: #161b22; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 16px; }
  pre code { background: none; padding: 0; font-size: 85%; }
  blockquote { border-left: 4px solid #3b434b; margin: 0; padding: 0 1em; color: #8b949e; margin-bottom: 16px; }
  ul, ol { padding-left: 2em; margin-bottom: 16px; }
  li { margin-bottom: 4px; }
  img { max-width: 100%; box-sizing: border-box; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th, td { border: 1px solid #30363d; padding: 6px 13px; text-align: left; }
  th { background: #161b22; font-weight: 600; }
  tr:nth-child(even) td { background: #161b22; }
  hr { border: 0; border-top: 1px solid #21262d; margin: 24px 0; }
`;

const previewCache = new Map<string, { html: string; title: string }>();

export function getPreviewHtml(uri: string): { html: string; title: string } | undefined {
  return previewCache.get(uri);
}

export function setPreviewHtml(uri: string, html: string, _title: string): void {
  previewCache.set(uri, { html: html + `\n<style>${GITHUB_CSS}</style>`, title: _title });
}

export function clearPreviewCache(uri: string): void {
  previewCache.delete(uri);
}

export function convertMarkdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export function MarkdownPreview({ uri }: { uri: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => getPreviewHtml(uri)?.html || "", [uri]);

  useEffect(() => {
    if (containerRef.current && html) {
      const iframe = containerRef.current.querySelector("iframe");
      if (iframe) {
        iframe.srcdoc = html;
      }
    }
  }, [html]);

  if (!html) {
    return (
      <div style={{ padding: 24, color: "#666", fontSize: 14, textAlign: "center" }}>
        Preview content not available.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      <iframe
        sandbox="allow-same-origin"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Markdown Preview"
        srcDoc={html}
      />
    </div>
  );
}
