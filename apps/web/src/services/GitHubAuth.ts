/**
 * Minimal GitHub credentials store + REST helpers.
 *
 * The IDE supports signing in to GitHub via a Personal Access Token (PAT)
 * stored locally (runtime-scoped localStorage). The token is used only for
 * the user's outbound calls to api.github.com and as the password for HTTPS
 * `git push` / `git pull` via isomorphic-git. It is never sent anywhere else.
 *
 * NOTE: This is the bootstrap credentials surface. A future iteration will
 * move desktop tokens into the OS keychain via Tauri's secure storage; the
 * shape returned by `getCredentials()` is kept stable so that swap is
 * transparent to callers.
 */
import { readRuntimeJSON, writeRuntimeJSON, runtimeStorageKey } from "../platform/runtime-storage.js";

const STORAGE_KEY = "githubAuth";

export interface GitHubCredentials {
  /** GitHub login (e.g. "octocat"). */
  username: string;
  /** Personal Access Token. */
  token: string;
  /** Optional human-readable name from the GitHub API. */
  displayName?: string;
  /** Avatar URL from /user. */
  avatarUrl?: string;
  /** When the token was last validated against api.github.com (ms epoch). */
  validatedAt?: number;
}

export interface GitHubUserResponse {
  login: string;
  name?: string | null;
  avatar_url?: string;
}

export type GitHubAuthListener = (
  credentials: GitHubCredentials | null,
) => void;

export class GitHubAuthService {
  private listeners = new Set<GitHubAuthListener>();
  private current: GitHubCredentials | null;

  constructor() {
    this.current = readRuntimeJSON<GitHubCredentials | null>(STORAGE_KEY, null);
  }

  /** Current credentials, or null if not signed in. */
  getCredentials(): GitHubCredentials | null {
    return this.current;
  }

  /** Subscribe to sign-in / sign-out events. */
  onChanged(listener: GitHubAuthListener): { dispose: () => void } {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  /**
   * Validate the supplied PAT against api.github.com and store on success.
   * Throws if the token is invalid, lacks scope, or the API is unreachable.
   */
  async signIn(token: string): Promise<GitHubCredentials> {
    const trimmed = token.trim();
    if (!trimmed) {
      throw new Error("GitHub token is empty");
    }

    const res = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${trimmed}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("GitHub rejected the token (401). Check that it's valid and has 'repo' scope.");
      }
      if (res.status === 403) {
        throw new Error("GitHub rate-limited or forbade the request (403). Try a new token with 'repo' scope.");
      }
      throw new Error(`GitHub API returned ${res.status} ${res.statusText}`);
    }

    const user = (await res.json()) as GitHubUserResponse;
    const creds: GitHubCredentials = {
      username: user.login,
      token: trimmed,
      displayName: user.name ?? undefined,
      avatarUrl: user.avatar_url,
      validatedAt: Date.now(),
    };
    this.current = creds;
    writeRuntimeJSON(STORAGE_KEY, creds);
    this.notify();
    return creds;
  }

  /** Clear stored credentials. */
  signOut(): void {
    this.current = null;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(runtimeStorageKey(STORAGE_KEY));
      }
    } catch {
      // best-effort
    }
    this.notify();
  }

  /**
   * Provide credentials in the shape isomorphic-git's `onAuth` callback expects.
   * Returns `null` when not signed in so callers can fall back to anonymous
   * (public read) operations.
   */
  asGitHttpAuth(): { username: string; password: string } | null {
    if (!this.current) return null;
    return { username: this.current.username, password: this.current.token };
  }

  private notify() {
    for (const l of this.listeners) l(this.current);
  }
}

/** Shared singleton — there's exactly one signed-in GitHub user per window. */
export const githubAuth = new GitHubAuthService();
