/**
 * GitService — real git operations using isomorphic-git + InMemoryFS.
 *
 * Provides: init, status, stage, unstage, commit, log, branches,
 * checkout, diff, remote management — all against the InMemoryFsAdapter.
 */

import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import type { WorkspaceManager } from "@webassembly-ide/ide-core";

export interface GitRemote {
  remote: string;
  url: string;
}

export interface GitPushResult {
  ok: boolean;
  ref?: string;
  oldOid?: string;
  newOid?: string;
  error?: string;
}

/**
 * Callback that returns HTTP basic credentials for an HTTPS git request.
 * Plug GitHubAuthService.asGitHttpAuth() in here (or any future provider).
 */
export type GitAuthProvider = (
  url: string,
) => { username: string; password: string } | null | undefined;

export interface GitFileStatus {
  filepath: string;
  status:
    | "new"
    | "modified"
    | "deleted"
    | "unmodified"
    | "staged"
    | "staged-modified"
    | "staged-deleted"
    | "ignored"
    | "absent";
  staged: boolean;
  /** Raw isomorphic-git status tuple [head, workdir, stage] */
  raw: string;
}

export interface GitCommit {
  oid: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

/** isomorphic-git filesystem plugin shape */
interface FsPlugin {
  promises: {
    readFile(
      path: string,
      opts?: { encoding?: string },
    ): Promise<string | Uint8Array>;
    writeFile(
      path: string,
      data: string | Uint8Array,
      opts?: { encoding?: string; mode?: number },
    ): Promise<void>;
    unlink(path: string): Promise<void>;
    readdir(path: string): Promise<string[]>;
    mkdir(path: string, opts?: { mode?: number }): Promise<void>;
    rmdir(path: string): Promise<void>;
    stat(path: string): Promise<{
      type: string;
      mode: number;
      size: number;
      ino: number;
      mtimeMs: number;
      ctimeMs: number;
      uid: number;
      gid: number;
    }>;
    lstat(path: string): Promise<{
      type: string;
      mode: number;
      size: number;
      ino: number;
      mtimeMs: number;
      ctimeMs: number;
      uid: number;
      gid: number;
    }>;
    readlink(path: string): Promise<string>;
    symlink(target: string, path: string): Promise<void>;
    chmod(path: string, mode: number): Promise<void>;
  };
}

/**
 * Build the isomorphic-git FS plugin from our WorkspaceManager's adapter.
 * isomorphic-git needs a { promises } shaped object.
 */
function buildFsPlugin(workspace: WorkspaceManager): FsPlugin {
  const statBase = () => ({
    mode: 0o666,
    size: 0,
    ino: 0,
    mtimeMs: Date.now(),
    ctimeMs: Date.now(),
    uid: 0,
    gid: 0,
  });

  return {
    promises: {
      async readFile(path: string, opts?: { encoding?: string }) {
        const result = await workspace.readFile(path);
        if (opts?.encoding === "utf8" || opts?.encoding === "utf-8") {
          return result.content;
        }
        return new TextEncoder().encode(result.content);
      },
      async writeFile(path: string, data: string | Uint8Array) {
        const content =
          typeof data === "string" ? data : new TextDecoder().decode(data);
        await workspace.writeFile(path, { content });
      },
      async unlink(path: string) {
        await workspace.deleteFile(path);
      },
      async readdir(path: string) {
        const entries = await workspace.listDirectory(path, { maxDepth: 0 });
        return entries.map((e) => e.name);
      },
      async mkdir(path: string) {
        await workspace.createDirectory(path);
      },
      async rmdir(path: string) {
        await workspace.deleteFile(path);
      },
      async stat(path: string) {
        try {
          const entry = await workspace.stat(path);
          return { ...statBase(), type: entry.isDirectory ? "dir" : "file" };
        } catch {
          return { ...statBase(), type: "file" };
        }
      },
      async lstat(path: string) {
        try {
          const entry = await workspace.stat(path);
          return { ...statBase(), type: entry.isDirectory ? "dir" : "file" };
        } catch {
          return { ...statBase(), type: "file" };
        }
      },
      async readlink(_path: string) {
        return "";
      },
      async symlink(_target: string, _path: string) {},
      async chmod(_path: string, _mode: number) {},
    },
  };
}

const GIT_AUTHOR = {
  name: "WebAssemblyIde User",
  email: "user@webassemblyide.dev",
};

export class GitService {
  private workspace: WorkspaceManager;
  private fs: FsPlugin;
  private dir: string;
  private initialized = false;
  private listeners = new Set<() => void>();
  private workspaceListener: { dispose: () => void } | null = null;
  private authProvider: GitAuthProvider | null = null;

  constructor(workspace: WorkspaceManager, dir?: string) {
    this.workspace = workspace;
    this.fs = buildFsPlugin(workspace);
    this.dir = dir ?? workspace.getActiveWorkspace()?.root ?? "/project";

    // Re-bind dir whenever the active workspace changes so desktop runtimes
    // operate on real paths instead of the in-memory demo root.
    this.workspaceListener = workspace.onEvent((event) => {
      if (event === "workspace:opened" || event === "workspace:closed") {
        const root = workspace.getActiveWorkspace()?.root ?? "/project";
        if (root !== this.dir) {
          this.dir = root;
          this.initialized = false;
          this.notify();
        }
      }
    });
  }

  /** Active git working directory (matches the active workspace root). */
  getDir(): string {
    return this.dir;
  }

  /** Override the working directory (rarely needed; primarily for tests). */
  setDir(dir: string): void {
    if (dir === this.dir) return;
    this.dir = dir;
    this.initialized = false;
    this.notify();
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  onChanged(listener: () => void): { dispose: () => void } {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  dispose(): void {
    this.workspaceListener?.dispose();
    this.workspaceListener = null;
    this.listeners.clear();
  }

  /**
   * Supply credentials for HTTPS git operations (push/pull/fetch/clone).
   * Pass `null` to clear (e.g. after sign out).
   */
  setAuthProvider(provider: GitAuthProvider | null): void {
    this.authProvider = provider;
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  async isRepo(): Promise<boolean> {
    try {
      await git.resolveRef({ fs: this.fs, dir: this.dir, ref: "HEAD" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize a new git repository at the active workspace root.
   * Only call this when the user explicitly asks to initialize a repo;
   * automatic init would otherwise create a `.git` directory inside the
   * user's real filesystem on desktop runtimes.
   */
  async init(): Promise<void> {
    if (this.initialized && (await this.isRepo())) return;
    if (!(await this.isRepo())) {
      await git.init({ fs: this.fs, dir: this.dir, defaultBranch: "main" });
    }
    this.initialized = true;
    this.notify();
  }

  /**
   * Resolve repo state without creating a new one. Returns false when the
   * active workspace is not a git repository.
   */
  private async ensureInit(): Promise<boolean> {
    if (this.initialized) return true;
    const exists = await this.isRepo();
    if (exists) {
      this.initialized = true;
      return true;
    }
    return false;
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  async getStatus(): Promise<GitFileStatus[]> {
    if (!(await this.ensureInit())) return [];
    try {
      const statusMatrix = await git.statusMatrix({
        fs: this.fs,
        dir: this.dir,
      });
      return statusMatrix
        .filter(
          ([, head, workdir, stage]) =>
            !(head === 1 && workdir === 1 && stage === 1),
        )
        .map(([filepath, head, workdir, stage]) => {
          const raw = `${head}${workdir}${stage}`;
          let status: GitFileStatus["status"] = "unmodified";
          let staged = false;

          if (head === 0 && workdir === 2 && stage === 0) {
            status = "new";
            staged = false;
          } else if (head === 0 && workdir === 2 && stage === 2) {
            status = "staged";
            staged = true;
          } else if (head === 1 && workdir === 2 && stage === 1) {
            status = "modified";
            staged = false;
          } else if (head === 1 && workdir === 2 && stage === 2) {
            status = "staged-modified";
            staged = true;
          } else if (head === 1 && workdir === 0 && stage === 0) {
            status = "deleted";
            staged = false;
          } else if (head === 1 && workdir === 0 && stage === 0) {
            status = "staged-deleted";
            staged = true;
          } else if (head === 0 && workdir === 0 && stage === 3) {
            status = "absent";
            staged = false;
          }

          return { filepath, status, staged, raw };
        });
    } catch {
      return [];
    }
  }

  // ─── Stage / Unstage ──────────────────────────────────────────────────────

  async stage(filepath: string): Promise<void> {
    if (!(await this.ensureInit())) return;
    await git.add({ fs: this.fs, dir: this.dir, filepath });
    this.notify();
  }

  async stageAll(): Promise<void> {
    if (!(await this.ensureInit())) return;
    const status = await this.getStatus();
    for (const f of status) {
      if (!f.staged) {
        if (f.status === "deleted") {
          await git.remove({
            fs: this.fs,
            dir: this.dir,
            filepath: f.filepath,
          });
        } else {
          await git.add({ fs: this.fs, dir: this.dir, filepath: f.filepath });
        }
      }
    }
    this.notify();
  }

  async unstage(filepath: string): Promise<void> {
    if (!(await this.ensureInit())) return;
    await git.resetIndex({ fs: this.fs, dir: this.dir, filepath });
    this.notify();
  }

  // ─── Commit ───────────────────────────────────────────────────────────────

  async commit(message: string): Promise<string> {
    if (!(await this.ensureInit())) {
      throw new Error(
        "Not a git repository. Initialize one before committing.",
      );
    }
    const sha = await git.commit({
      fs: this.fs,
      dir: this.dir,
      message,
      author: GIT_AUTHOR,
    });
    this.notify();
    return sha;
  }

  // ─── Log ──────────────────────────────────────────────────────────────────

  async getLog(maxCount = 50): Promise<GitCommit[]> {
    if (!(await this.ensureInit())) return [];
    try {
      const commits = await git.log({
        fs: this.fs,
        dir: this.dir,
        depth: maxCount,
      });
      return commits.map((c) => ({
        oid: c.oid,
        message: c.commit.message.trim(),
        author: `${c.commit.author.name} <${c.commit.author.email}>`,
        timestamp: c.commit.author.timestamp * 1000,
      }));
    } catch {
      return [];
    }
  }

  // ─── Branches ─────────────────────────────────────────────────────────────

  async getBranches(): Promise<GitBranch[]> {
    if (!(await this.ensureInit())) return [];
    try {
      const [local, current] = await Promise.all([
        git.listBranches({ fs: this.fs, dir: this.dir }),
        git.currentBranch({ fs: this.fs, dir: this.dir }).catch(() => "main"),
      ]);
      return local.map((name) => ({ name, current: name === current }));
    } catch {
      return [{ name: "main", current: true }];
    }
  }

  async currentBranch(): Promise<string> {
    if (!(await this.ensureInit())) return "main";
    try {
      return (
        (await git.currentBranch({ fs: this.fs, dir: this.dir })) ?? "main"
      );
    } catch {
      return "main";
    }
  }

  async createBranch(name: string): Promise<void> {
    if (!(await this.ensureInit())) {
      throw new Error(
        "Not a git repository. Initialize one before creating branches.",
      );
    }
    await git.branch({ fs: this.fs, dir: this.dir, ref: name });
    this.notify();
  }

  async checkout(branch: string): Promise<void> {
    if (!(await this.ensureInit())) {
      throw new Error(
        "Not a git repository. Initialize one before checking out branches.",
      );
    }
    await git.checkout({ fs: this.fs, dir: this.dir, ref: branch });
    this.notify();
  }

  // ─── Remotes ──────────────────────────────────────────────────────────────

  async listRemotes(): Promise<GitRemote[]> {
    if (!(await this.ensureInit())) return [];
    try {
      return await git.listRemotes({ fs: this.fs, dir: this.dir });
    } catch {
      return [];
    }
  }

  async addRemote(remote: string, url: string): Promise<void> {
    if (!(await this.ensureInit())) {
      throw new Error("Not a git repository. Initialize before adding a remote.");
    }
    await git.addRemote({ fs: this.fs, dir: this.dir, remote, url, force: true });
    this.notify();
  }

  async removeRemote(remote: string): Promise<void> {
    if (!(await this.ensureInit())) return;
    await git.deleteRemote({ fs: this.fs, dir: this.dir, remote });
    this.notify();
  }

  // ─── Push / Pull / Fetch ──────────────────────────────────────────────────

  private buildOnAuth(): (url: string) => { username: string; password: string } | { cancel: true } {
    const provider = this.authProvider;
    return (url: string) => {
      const creds = provider?.(url);
      if (creds && creds.username && creds.password) {
        return { username: creds.username, password: creds.password };
      }
      return { cancel: true };
    };
  }

  async push(options: {
    remote?: string;
    ref?: string;
    force?: boolean;
    onProgress?: (phase: string, loaded?: number, total?: number) => void;
  } = {}): Promise<GitPushResult> {
    if (!(await this.ensureInit())) {
      return { ok: false, error: "Not a git repository." };
    }
    const remote = options.remote ?? "origin";
    const ref = options.ref ?? (await this.currentBranch());
    try {
      const result = await git.push({
        fs: this.fs,
        http,
        dir: this.dir,
        remote,
        ref,
        force: options.force,
        onAuth: this.buildOnAuth(),
        onProgress: options.onProgress
          ? (e) => options.onProgress?.(e.phase, e.loaded, e.total)
          : undefined,
      });
      this.notify();
      const ok = result.ok ?? false;
      const errMsg = result.error ?? undefined;
      return {
        ok,
        ref: result.refs?.[ref]?.ok ? ref : undefined,
        error: ok ? undefined : (errMsg ?? "Push failed"),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  }

  async fetch(options: {
    remote?: string;
    ref?: string;
    depth?: number;
  } = {}): Promise<{ ok: boolean; error?: string }> {
    if (!(await this.ensureInit())) {
      return { ok: false, error: "Not a git repository." };
    }
    try {
      await git.fetch({
        fs: this.fs,
        http,
        dir: this.dir,
        remote: options.remote ?? "origin",
        ref: options.ref,
        depth: options.depth,
        onAuth: this.buildOnAuth(),
      });
      this.notify();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async pull(options: {
    remote?: string;
    ref?: string;
    fastForwardOnly?: boolean;
  } = {}): Promise<{ ok: boolean; error?: string }> {
    if (!(await this.ensureInit())) {
      return { ok: false, error: "Not a git repository." };
    }
    try {
      await git.pull({
        fs: this.fs,
        http,
        dir: this.dir,
        remote: options.remote ?? "origin",
        ref: options.ref ?? (await this.currentBranch()),
        fastForwardOnly: options.fastForwardOnly ?? true,
        author: GIT_AUTHOR,
        onAuth: this.buildOnAuth(),
      });
      this.notify();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // ─── Diff ─────────────────────────────────────────────────────────────────

  async getDiff(filepath: string): Promise<string> {
    if (!(await this.ensureInit())) return "(not a git repository)";
    try {
      const headOid = await git
        .resolveRef({ fs: this.fs, dir: this.dir, ref: "HEAD" })
        .catch(() => null);
      if (!headOid) return "(new file — no HEAD to diff against)";

      const { blob: headBlob } = await git
        .readBlob({
          fs: this.fs,
          dir: this.dir,
          oid: headOid,
          filepath,
        })
        .catch(() => ({ blob: new Uint8Array() }));

      const currentResult = await this.workspace
        .readFile(`${this.dir}/${filepath}`)
        .catch(() => ({ content: "" }));

      const headLines = new TextDecoder().decode(headBlob).split("\n");
      const currentLines = currentResult.content.split("\n");

      const diff: string[] = [`--- a/${filepath}`, `+++ b/${filepath}`];
      const maxLen = Math.max(headLines.length, currentLines.length);
      for (let i = 0; i < maxLen; i++) {
        const hl = headLines[i];
        const cl = currentLines[i];
        if (hl !== cl) {
          if (hl !== undefined) diff.push(`-${hl}`);
          if (cl !== undefined) diff.push(`+${cl}`);
        }
      }
      return diff.join("\n") || "(no changes)";
    } catch {
      return "(diff unavailable)";
    }
  }
}
