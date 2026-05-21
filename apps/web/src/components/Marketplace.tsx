import { useMemo, useState } from "react";
import {
  MarketplaceClient,
  type MarketplaceExtension,
} from "@webassembly-ide/ide-core";

export function Marketplace() {
  const client = useMemo(
    () => new MarketplaceClient({ provider: "open-vsx" }),
    [],
  );
  const [query, setQuery] = useState("theme");
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    setState("loading");
    setError(null);
    try {
      setExtensions(await client.search({ query, pageSize: 20 }));
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  return (
    <section
      aria-label="Extension marketplace"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div style={{ padding: 8, borderBottom: "1px solid #333333" }}>
        <strong>Extensions</strong>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            aria-label="Search extensions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void runSearch();
            }}
            style={{
              flex: 1,
              background: "#3c3c3c",
              color: "#cccccc",
              border: 0,
              padding: 6,
            }}
          />
          <button type="button" onClick={() => void runSearch()}>
            Search
          </button>
        </div>
      </div>

      {state === "loading" && (
        <div style={{ padding: 8 }}>Searching marketplace…</div>
      )}
      {error && <div style={{ padding: 8, color: "#f85149" }}>{error}</div>}

      <div style={{ overflow: "auto", flex: 1 }}>
        {extensions.map((extension) => (
          <article
            key={extension.id}
            style={{ padding: 10, borderBottom: "1px solid #333333" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <strong>{extension.displayName}</strong>
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                {extension.securityReviewStatus ?? "unknown"}
              </span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {extension.publisher} • {extension.version ?? "n/a"}
            </div>
            <p style={{ margin: "6px 0", fontSize: 12 }}>
              {extension.description}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button">Install</button>
              <button type="button">Enable</button>
              <button type="button">Security Review</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
