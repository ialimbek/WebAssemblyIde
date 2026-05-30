/**
 * Marketplace client and extension metadata contracts.
 *
 * Keeps extension discovery behind an explicit client boundary. The default
 * client is provider-agnostic and can target Open VSX, VS Code Marketplace
 * compatible endpoints, or a future first-party registry.
 */

export type MarketplaceProvider = "open-vsx" | "vscode-marketplace" | "custom";

export interface ExtensionManifestContribution {
  commands?: Array<{ command: string; title: string; category?: string }>;
  languages?: Array<{ id: string; extensions?: string[]; aliases?: string[] }>;
  themes?: Array<{ id: string; label: string; path: string; uiTheme?: string }>;
}

export interface ExtensionManifest {
  name: string;
  displayName?: string;
  publisher: string;
  version: string;
  engines?: { vscode?: string; codemblyIde?: string };
  contributes?: ExtensionManifestContribution;
  main?: string;
  browser?: string;
  activationEvents?: string[];
}

export interface MarketplaceExtension {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  description?: string;
  version?: string;
  rating?: number;
  downloadCount?: number;
  installed?: boolean;
  enabled?: boolean;
  securityReviewStatus?: "unknown" | "trusted" | "warning" | "blocked";
  manifest?: ExtensionManifest;
}

export interface MarketplaceSearchOptions {
  query: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface MarketplaceClientConfig {
  provider: MarketplaceProvider;
  endpoint?: string;
  fetcher?: typeof fetch;
}

export class MarketplaceClient {
  private readonly provider: MarketplaceProvider;
  private readonly endpoint: string;
  private readonly fetcher?: typeof fetch;

  constructor(config: MarketplaceClientConfig) {
    this.provider = config.provider;
    this.endpoint =
      config.endpoint ??
      (config.provider === "open-vsx"
        ? "https://open-vsx.org/api"
        : "https://marketplace.visualstudio.com/_apis/public/gallery");
    this.fetcher = config.fetcher;
  }

  async search(
    options: MarketplaceSearchOptions,
  ): Promise<MarketplaceExtension[]> {
    if (!this.fetcher) {
      return this.createPlaceholderResults(options.query);
    }

    if (this.provider === "open-vsx") {
      return this.searchOpenVsx(options);
    }

    return this.createPlaceholderResults(options.query);
  }

  async install(extensionId: string): Promise<MarketplaceExtension> {
    return {
      id: extensionId,
      name: extensionId.split(".").pop() ?? extensionId,
      displayName: extensionId,
      publisher: extensionId.split(".")[0] ?? "unknown",
      installed: true,
      enabled: true,
      securityReviewStatus: "unknown",
    };
  }

  async uninstall(
    extensionId: string,
  ): Promise<{ id: string; installed: false }> {
    return { id: extensionId, installed: false };
  }

  async setEnabled(
    extensionId: string,
    enabled: boolean,
  ): Promise<{ id: string; enabled: boolean }> {
    return { id: extensionId, enabled };
  }

  private async searchOpenVsx(
    options: MarketplaceSearchOptions,
  ): Promise<MarketplaceExtension[]> {
    const url = new URL(`${this.endpoint}/-/search`);
    url.searchParams.set("query", options.query);
    url.searchParams.set("size", String(options.pageSize ?? 20));
    url.searchParams.set(
      "offset",
      String((options.page ?? 0) * (options.pageSize ?? 20)),
    );

    const response = await this.fetcher!(url.toString());
    if (!response.ok)
      throw new Error(`Marketplace search failed: ${response.status}`);

    const payload = (await response.json()) as {
      extensions?: Array<{
        namespace: string;
        name: string;
        displayName?: string;
        description?: string;
        version?: string;
        averageRating?: number;
        downloadCount?: number;
      }>;
    };

    return (payload.extensions ?? []).map((extension) => ({
      id: `${extension.namespace}.${extension.name}`,
      name: extension.name,
      displayName: extension.displayName ?? extension.name,
      publisher: extension.namespace,
      description: extension.description,
      version: extension.version,
      rating: extension.averageRating,
      downloadCount: extension.downloadCount,
      installed: false,
      enabled: false,
      securityReviewStatus: "unknown",
    }));
  }

  private createPlaceholderResults(query: string): MarketplaceExtension[] {
    const baseQuery = query.trim() || "extension";
    return [
      {
        id: "builtin.theme-compat",
        name: "theme-compat",
        displayName: "Theme Compatibility Pack",
        publisher: "builtin",
        description: `Local placeholder result for ${baseQuery}`,
        version: "0.0.0",
        installed: false,
        enabled: false,
        securityReviewStatus: "unknown",
      },
    ];
  }
}
