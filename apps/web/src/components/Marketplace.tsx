import { useEffect, useMemo, useState } from "react";
import {
  MarketplaceClient,
  type MarketplaceExtension,
} from "@webassembly-ide/ide-core";

const STORAGE_KEY = "ide.marketplace.installed";

type InstalledMap = Record<
  string,
  { id: string; displayName: string; enabled: boolean }
>;

function loadInstalled(): InstalledMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InstalledMap) : {};
  } catch {
    return {};
  }
}

function persistInstalled(installed: InstalledMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));
  } catch {
    /* ignore quota errors */
  }
}

export function Marketplace() {
  const client = useMemo(() => {
    // When running in a browser context, pass window.fetch so the client
    // actually hits Open VSX; otherwise the client falls back to its built-in
    // placeholder results.
    const fetcher: typeof fetch | undefined =
      typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined;
    return new MarketplaceClient({ provider: "open-vsx", fetcher });
  }, []);
  const [query, setQuery] = useState("theme");
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [installed, setInstalled] = useState<InstalledMap>(() =>
    loadInstalled(),
  );
  const [view, setView] = useState<"search" | "installed">("search");

  useEffect(() => {
    persistInstalled(installed);
  }, [installed]);

  async function runSearch() {
    setState("loading");
    setError(null);
    try {
      const results = await client.search({ query, pageSize: 20 });
      setExtensions(
        results.map((ext) => ({
          ...ext,
          installed: Boolean(installed[ext.id]),
          enabled: installed[ext.id]?.enabled ?? false,
        })),
      );
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  async function handleInstall(extension: MarketplaceExtension) {
    try {
      const installedExt = await client.install(extension.id);
      setInstalled((prev) => ({
        ...prev,
        [extension.id]: {
          id: extension.id,
          displayName:
            installedExt.displayName ??
            extension.displayName ??
            extension.name,
          enabled: true,
        },
      }));
      setExtensions((prev) =>
        prev.map((ext) =>
          ext.id === extension.id
            ? { ...ext, installed: true, enabled: true }
            : ext,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleUninstall(extension: MarketplaceExtension) {
    try {
      await client.uninstall(extension.id);
      setInstalled((prev) => {
        const next = { ...prev };
        delete next[extension.id];
        return next;
      });
      setExtensions((prev) =>
        prev.map((ext) =>
          ext.id === extension.id
            ? { ...ext, installed: false, enabled: false }
            : ext,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleToggleEnabled(extension: MarketplaceExtension) {
    const nextEnabled = !(installed[extension.id]?.enabled ?? false);
    try {
      await client.setEnabled(extension.id, nextEnabled);
      setInstalled((prev) => ({
        ...prev,
        [extension.id]: {
          ...(prev[extension.id] ?? {
            id: extension.id,
            displayName: extension.displayName ?? extension.name,
            enabled: nextEnabled,
          }),
          enabled: nextEnabled,
        },
      }));
      setExtensions((prev) =>
        prev.map((ext) =>
          ext.id === extension.id ? { ...ext, enabled: nextEnabled } : ext,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const installedExtensions: MarketplaceExtension[] = useMemo(
    () =>
      Object.values(installed).map((entry) => ({
        id: entry.id,
        name: entry.id.split(".").pop() ?? entry.id,
        displayName: entry.displayName,
        publisher: entry.id.split(".")[0] ?? "unknown",
        installed: true,
        enabled: entry.enabled,
        securityReviewStatus: "unknown",
      })),
    [installed],
  );

  const visible = view === "installed" ? installedExtensions : extensions;

  return (
    <section
      aria-label="Extension marketplace"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div style={{ padding: 8, borderBottom: "1px solid #333333" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ flex: 1 }}>Extensions</strong>
          <button
            type="button"
            onClick={() => setView("search")}
            aria-pressed={view === "search"}
            style={tabButtonStyle(view === "search")}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setView("installed")}
            aria-pressed={view === "installed"}
            style={tabButtonStyle(view === "installed")}
          >
            Installed ({installedExtensions.length})
          </button>
        </div>
        {view === "search" && (
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
        )}
      </div>

      {state === "loading" && (
        <div style={{ padding: 8 }}>Searching marketplace…</div>
      )}
      {error && <div style={{ padding: 8, color: "#f85149" }}>{error}</div>}

      <div style={{ overflow: "auto", flex: 1 }}>
        {visible.length === 0 && state !== "loading" ? (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              fontSize: 12,
              color: "#999999",
            }}
          >
            {view === "installed"
              ? "No extensions installed yet."
              : "No results. Search for an extension above."}
          </div>
        ) : (
          visible.map((extension) => {
            const isInstalled = Boolean(
              installed[extension.id] ?? extension.installed,
            );
            const isEnabled = installed[extension.id]?.enabled ?? false;
            return (
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
                {extension.description && (
                  <p style={{ margin: "6px 0", fontSize: 12 }}>
                    {extension.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {isInstalled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleToggleEnabled(extension)}
                      >
                        {isEnabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleUninstall(extension)}
                      >
                        Uninstall
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleInstall(extension)}
                    >
                      Install
                    </button>
                  )}
                  <button
                    type="button"
                    title="View security review notes"
                    onClick={() =>
                      setError(
                        `Security review for ${extension.displayName}: ${
                          extension.securityReviewStatus ?? "unknown"
                        }. Review extension permissions before enabling.`,
                      )
                    }
                  >
                    Security Review
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "2px 8px",
    background: active ? "var(--button-background, #0e639c)" : "transparent",
    color: active ? "#ffffff" : "#cccccc",
    border: "1px solid rgba(128,128,128,0.3)",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 11,
  };
}
