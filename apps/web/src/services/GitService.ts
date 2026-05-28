/**
 * GitService — real git operations using isomorphic-git + InMemoryFS.
 *
 * Provides: init, status, stage, unstage, commit, log, branches,
 * checkout, diff, remote management — all against the InMemoryFsAdapter.
 */

import git from "isomorphic-git";
import type { WorkspaceManager } from "@webassembly-ide/ide-core";

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
  const statBase = (size = 0, mtimeMs?: number) => ({
    mode: 0o666,
    size,
    ino: 0,
    mtimeMs: mtimeMs ?? Date.now(),
    ctimeMs: mtimeMs ?? Date.now(),
    uid: 0,
    gid: 0,
  });

  const doStat = async (path: string) => {
    const exists = await workspace.exists(path);
    if (!exists) {
      const err = new Error(`ENOENT: no such file or directory, stat '${path}'`) as Error & { code: string };
      err.code = "ENOENT";
      throw err;
    }
    const entry = await workspace.stat(path);
    return {
      ...statBase(entry.size, entry.modifiedAt),
      type: entry.isDirectory ? "dir" : "file",
      mode: entry.isDirectory ? 0o777 : 0o666,
    };
  };

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
        await workspace.writeFile(path, { content, createDirs: true });
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
        return doStat(path);
      },
      async lstat(path: string) {
        return doStat(path);
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
  private initialized = false;
  private listeners = new Set<() => void>();

  constructor(workspace: WorkspaceManager) {
    this.workspace = workspace;
    this.fs = buildFsPlugin(workspace);
  }

  private get dir(): string {
    return this.workspace.getActiveWorkspace()?.root ?? "/project";
  }

  reset(): void {
    this.initialized = false;
    this.notify();
  }

  triggerRefresh(): void {
    this.notify();
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  onChanged(listener: () => void): { dispose: () => void } {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
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

  async init(): Promise<void> {
    if (this.initialized) return;
    const isRepo = await this.isRepo();
    if (!isRepo) {
      await git.init({ fs: this.fs, dir: this.dir, defaultBranch: "main" });
    }
    this.initialized = true;
    this.notify();
  }

  private async ensureInit() {
    if (!this.initialized) await this.init();
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  async getStatus(): Promise<GitFileStatus[]> {
    await this.ensureInit();
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
            status = "staged-deleted";
            staged = true;
          } else if (head === 1 && workdir === 0 && stage === 1) {
            status = "deleted";
            staged = false;
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
    await this.ensureInit();
    await git.add({ fs: this.fs, dir: this.dir, filepath });
    this.notify();
  }

  async stageAll(): Promise<void> {
    await this.ensureInit();
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
    await this.ensureInit();
    await git.resetIndex({ fs: this.fs, dir: this.dir, filepath });
    this.notify();
  }

  // ─── Commit ───────────────────────────────────────────────────────────────

  async commit(message: string): Promise<string> {
    await this.ensureInit();
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
    await this.ensureInit();
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
    await this.ensureInit();
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
    await this.ensureInit();
    try {
      return (
        (await git.currentBranch({ fs: this.fs, dir: this.dir })) ?? "main"
      );
    } catch {
      return "main";
    }
  }

  async createBranch(name: string): Promise<void> {
    await this.ensureInit();
    await git.branch({ fs: this.fs, dir: this.dir, ref: name });
    this.notify();
  }

  async checkout(branch: string): Promise<void> {
    await this.ensureInit();
    await git.checkout({ fs: this.fs, dir: this.dir, ref: branch });
    this.notify();
  }

  // ─── Diff ─────────────────────────────────────────────────────────────────

  async getDiff(filepath: string): Promise<string> {
    await this.ensureInit();
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
