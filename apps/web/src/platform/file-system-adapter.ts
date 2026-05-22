import { invoke } from "@tauri-apps/api/core";
import {
  InMemoryFsAdapter,
  type FileChangeEvent,
  type FileReadResult,
  type FileSystemAdapter,
  type FileWriteOptions,
  type ListDirectoryOptions,
  type WorkspaceEntry,
} from "@webassembly-ide/ide-core";
import type { Disposable } from "@webassembly-ide/shared";

export interface PreparedWorkspace {
  root: string;
  name: string;
}

export interface PickedFile extends FileReadResult {
  path: string;
  name: string;
}

export interface IDEFileSystemAdapter extends FileSystemAdapter {
  readonly kind: "tauri" | "browser-demo";
  readonly supportsNativePickers: boolean;
  pickWorkspaceRoot(): Promise<string | null>;
  prepareWorkspace(root: string): Promise<PreparedWorkspace>;
  pickFile(): Promise<PickedFile | null>;
}

interface TauriFileReadResult extends FileReadResult {
  path: string;
  name: string;
}

declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.__TAURI__ !== undefined || window.__TAURI_INTERNALS__ !== undefined)
  );
}

export function createDefaultFileSystemAdapter(): IDEFileSystemAdapter {
  if (isTauriRuntime()) {
    return new TauriFileSystemAdapter();
  }

  return new BrowserDemoFileSystemAdapter(createDemoWorkspaceFiles());
}

class TauriFileSystemAdapter implements IDEFileSystemAdapter {
  readonly name = "tauri-desktop";
  readonly kind = "tauri" as const;
  readonly canWrite = true;
  readonly canWatch = false;
  readonly supportsNativePickers = true;

  async pickWorkspaceRoot(): Promise<string | null> {
    return invoke<string | null>("desktop_pick_directory");
  }

  async prepareWorkspace(root: string): Promise<PreparedWorkspace> {
    return invoke<PreparedWorkspace>("desktop_open_workspace", { root });
  }

  async pickFile(): Promise<PickedFile | null> {
    const result = await invoke<TauriFileReadResult | null>("desktop_pick_file");
    return result ? mapPickedFile(result) : null;
  }

  async readFile(path: string): Promise<FileReadResult> {
    const result = await invoke<TauriFileReadResult>("desktop_read_file", {
      path,
    });
    return mapFileReadResult(result);
  }

  async writeFile(path: string, options: FileWriteOptions): Promise<void> {
    await invoke("desktop_write_file", {
      path,
      content: options.content,
      createDirs: options.createDirs ?? false,
    });
  }

  async deleteFile(path: string): Promise<void> {
    await invoke("desktop_delete_path", { path });
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    await invoke("desktop_rename_path", { oldPath, newPath });
  }

  async exists(path: string): Promise<boolean> {
    return invoke<boolean>("desktop_exists", { path });
  }

  async isDirectory(path: string): Promise<boolean> {
    return invoke<boolean>("desktop_is_directory", { path });
  }

  async listDirectory(
    path: string,
    options?: ListDirectoryOptions,
  ): Promise<WorkspaceEntry[]> {
    return invoke<WorkspaceEntry[]>("desktop_list_directory", {
      path,
      maxDepth: options?.maxDepth ?? 1,
      includeHidden: options?.includeHidden ?? false,
      limit: options?.limit ?? 5_000,
    });
  }

  async stat(path: string): Promise<WorkspaceEntry> {
    return invoke<WorkspaceEntry>("desktop_stat", { path });
  }

  async createDirectory(path: string): Promise<void> {
    await invoke("desktop_create_directory", { path });
  }

  watch(_path: string, _callback: (event: FileChangeEvent) => void): Disposable {
    return { dispose: () => undefined };
  }
}

class BrowserDemoFileSystemAdapter
  extends InMemoryFsAdapter
  implements IDEFileSystemAdapter
{
  readonly kind = "browser-demo" as const;
  readonly supportsNativePickers = false;

  async pickWorkspaceRoot(): Promise<string | null> {
    return window.prompt("Demo workspace root", "/project");
  }

  async prepareWorkspace(root: string): Promise<PreparedWorkspace> {
    return { root, name: root.split("/").filter(Boolean).pop() ?? root };
  }

  async pickFile(): Promise<PickedFile | null> {
    return null;
  }
}

function mapPickedFile(result: TauriFileReadResult): PickedFile {
  return {
    path: result.path,
    name: result.name,
    ...mapFileReadResult(result),
  };
}

function mapFileReadResult(result: FileReadResult): FileReadResult {
  return {
    content: result.content,
    encoding: result.encoding,
    size: result.size,
    modifiedAt: result.modifiedAt,
    fromCache: result.fromCache,
  };
}

function createDemoWorkspaceFiles(): Record<string, string> {
  return {
    "/project/README.md":
      "# WebAssemblyIde\n\nA next-generation, AI-native IDE.\n",
    "/project/src/main.ts":
      'import { createApp } from "./app";\n\nconst app = createApp();\napp.start();\n',
    "/project/src/app.ts":
      'export function createApp() {\n  return {\n    start() {\n      console.log("App started");\n    },\n  };\n}\n',
    "/project/package.json":
      '{\n  "name": "project",\n  "version": "1.0.0"\n}\n',
    "/project/tsconfig.json":
      '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "strict": true\n  }\n}\n',
  };
}
