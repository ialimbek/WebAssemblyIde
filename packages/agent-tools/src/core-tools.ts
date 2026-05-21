/**
 * Core Agent Tools — read_file, search_files, apply_patch, run_command, list_files, write_file.
 * These tools interact with the workspace through the FileSystemAdapter abstraction.
 * Based on ARCHITECTURE.md §6.2 Tool Registry and TODO.md §2.13.
 */

import type { ToolManifest, ToolHandler } from "./tool-registry";

// ── Tool Manifests ──

export const READ_FILE_MANIFEST: ToolManifest = {
  name: "read_file",
  description:
    "Read the contents of a file at the specified path. Returns the file content as a string.",
  category: "filesystem",
  riskLevel: "low",
  permissionRequired: "observe",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path of the file to read" },
      startLine: {
        type: "number",
        description: "Optional 1-based start line number",
      },
      endLine: {
        type: "number",
        description: "Optional 1-based end line number",
      },
    },
    required: ["path"],
  },
  requiresApproval: false,
};

export const WRITE_FILE_MANIFEST: ToolManifest = {
  name: "write_file",
  description:
    "Write content to a file. Creates the file if it does not exist, overwrites if it does.",
  category: "filesystem",
  riskLevel: "medium",
  permissionRequired: "edit",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path of the file to write" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["path", "content"],
  },
  requiresApproval: true,
};

export const SEARCH_FILES_MANIFEST: ToolManifest = {
  name: "search_files",
  description:
    "Search for a regex pattern across files in a directory. Returns matching lines with context.",
  category: "filesystem",
  riskLevel: "low",
  permissionRequired: "observe",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory to search in" },
      regex: { type: "string", description: "Regex pattern to search for" },
      filePattern: {
        type: "string",
        description: "Glob pattern to filter files (e.g., '*.ts')",
      },
    },
    required: ["path", "regex"],
  },
  requiresApproval: false,
};

export const LIST_FILES_MANIFEST: ToolManifest = {
  name: "list_files",
  description: "List files and directories at the specified path.",
  category: "filesystem",
  riskLevel: "low",
  permissionRequired: "observe",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path to list" },
      recursive: {
        type: "boolean",
        description: "Whether to list recursively",
      },
    },
    required: ["path"],
  },
  requiresApproval: false,
};

export const APPLY_PATCH_MANIFEST: ToolManifest = {
  name: "apply_patch",
  description:
    "Apply a unified diff patch to a file. Supports SEARCH/REPLACE block format.",
  category: "filesystem",
  riskLevel: "medium",
  permissionRequired: "edit",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path of the file to patch" },
      diff: {
        type: "string",
        description: "Unified diff or SEARCH/REPLACE blocks to apply",
      },
    },
    required: ["path", "diff"],
  },
  requiresApproval: true,
};

export const RUN_COMMAND_MANIFEST: ToolManifest = {
  name: "run_command",
  description:
    "Run a shell command. Returns exit code, stdout, and stderr. Subject to command policy guard.",
  category: "terminal",
  riskLevel: "medium",
  permissionRequired: "execute",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string", description: "Command to execute" },
      cwd: {
        type: "string",
        description: "Working directory for the command",
      },
      args: {
        type: "array",
        items: { type: "string" },
        description: "Command arguments",
      },
    },
    required: ["command"],
  },
  requiresApproval: true,
};

export const GIT_DIFF_MANIFEST: ToolManifest = {
  name: "git_diff",
  description: "Get the git diff of the current workspace changes.",
  category: "git",
  riskLevel: "low",
  permissionRequired: "observe",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Optional specific file path to diff",
      },
      staged: {
        type: "boolean",
        description: "Show staged changes instead of working tree",
      },
    },
  },
  requiresApproval: false,
};

export const RUN_TESTS_MANIFEST: ToolManifest = {
  name: "run_tests",
  description:
    "Run the project test suite. Parses output for pass/fail results.",
  category: "terminal",
  riskLevel: "medium",
  permissionRequired: "execute",
  inputSchema: {
    type: "object",
    properties: {
      testCommand: {
        type: "string",
        description: "Test command to run (e.g., 'npm test')",
      },
      cwd: {
        type: "string",
        description: "Working directory",
      },
    },
  },
  requiresApproval: false,
};

// ── All core tool manifests ──

export const CORE_TOOL_MANIFESTS: ToolManifest[] = [
  READ_FILE_MANIFEST,
  WRITE_FILE_MANIFEST,
  SEARCH_FILES_MANIFEST,
  LIST_FILES_MANIFEST,
  APPLY_PATCH_MANIFEST,
  RUN_COMMAND_MANIFEST,
  GIT_DIFF_MANIFEST,
  RUN_TESTS_MANIFEST,
];

// ── Tool Handler Factories ──
// These create tool handlers that use a FileSystemAdapter interface.

/** FileSystemAdapter interface for tool handlers */
export interface ToolFsAdapter {
  readFile(path: string): Promise<{ content: string; error?: string }>;
  writeFile(path: string, content: string): Promise<{ error?: string }>;
  listDirectory(
    path: string,
    recursive?: boolean,
  ): Promise<{
    entries: Array<{ name: string; path: string; isDir: boolean }>;
    error?: string;
  }>;
  exists(path: string): Promise<boolean>;
}

/** CommandRunner interface for terminal tools */
export interface ToolCommandRunner {
  run(
    command: string,
    args?: string[],
    cwd?: string,
  ): Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

/** Create a read_file tool handler. */
export function createReadFileTool(fs: ToolFsAdapter): ToolHandler {
  return async (args) => {
    const path = args.path as string;
    const startLine = args.startLine as number | undefined;
    const endLine = args.endLine as number | undefined;

    const result = await fs.readFile(path);
    if (result.error) {
      return { success: false, output: "", error: result.error };
    }

    let content = result.content;
    if (startLine !== undefined || endLine !== undefined) {
      const lines = content.split("\n");
      const start = Math.max(0, (startLine ?? 1) - 1);
      const end = Math.min(lines.length, endLine ?? lines.length);
      content = lines.slice(start, end).join("\n");
    }

    return {
      success: true,
      output: content,
      metadata: { path, length: content.length },
    };
  };
}

/** Create a write_file tool handler. */
export function createWriteFileTool(fs: ToolFsAdapter): ToolHandler {
  return async (args) => {
    const path = args.path as string;
    const content = args.content as string;

    const result = await fs.writeFile(path, content);
    if (result.error) {
      return { success: false, output: "", error: result.error };
    }

    return {
      success: true,
      output: `File written: ${path}`,
      filesChanged: [path],
    };
  };
}

/** Create a list_files tool handler. */
export function createListFilesTool(fs: ToolFsAdapter): ToolHandler {
  return async (args) => {
    const path = args.path as string;
    const recursive = (args.recursive as boolean) ?? false;

    const result = await fs.listDirectory(path, recursive);
    if (result.error) {
      return { success: false, output: "", error: result.error };
    }

    const output = result.entries
      .map((e) => `${e.isDir ? "[dir] " : "      "}${e.path}`)
      .join("\n");

    return {
      success: true,
      output: output || "(empty directory)",
      metadata: { count: result.entries.length },
    };
  };
}

/** Create a search_files tool handler. */
export function createSearchFilesTool(fs: ToolFsAdapter): ToolHandler {
  return async (args) => {
    const path = args.path as string;
    const regex = args.regex as string;
    const filePattern = args.filePattern as string | undefined;

    const listResult = await fs.listDirectory(path, true);
    if (listResult.error) {
      return { success: false, output: "", error: listResult.error };
    }

    let files = listResult.entries.filter((e) => !e.isDir);

    // Filter by glob pattern
    if (filePattern) {
      const globRegex = new RegExp(
        filePattern.replace(/\*/g, ".*").replace(/\?/g, "."),
        "i",
      );
      files = files.filter((f) => globRegex.test(f.name));
    }

    let pattern: RegExp;
    try {
      pattern = new RegExp(regex, "gi");
    } catch {
      return { success: false, output: "", error: "Invalid regex pattern" };
    }

    const results: string[] = [];
    let matchCount = 0;

    for (const file of files.slice(0, 500)) {
      const content = await fs.readFile(file.path);
      if (content.error) continue;

      const lines = content.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          matchCount++;
          results.push(`${file.path}:${i + 1}: ${lines[i].trim()}`);
          pattern.lastIndex = 0; // Reset regex state
        }
      }
    }

    return {
      success: true,
      output: results.join("\n") || "No matches found",
      metadata: { matchCount, filesSearched: files.length },
    };
  };
}

/** Create an apply_patch tool handler. */
export function createApplyPatchTool(fs: ToolFsAdapter): ToolHandler {
  return async (args) => {
    const path = args.path as string;
    const diff = args.diff as string;

    const readResult = await fs.readFile(path);
    if (readResult.error) {
      return { success: false, output: "", error: readResult.error };
    }

    // Parse SEARCH/REPLACE blocks
    const searchReplaceBlocks = parseSearchReplaceBlocks(diff);
    if (searchReplaceBlocks.length === 0) {
      return {
        success: false,
        output: "",
        error: "No valid SEARCH/REPLACE blocks found in diff",
      };
    }

    let content = readResult.content;
    let appliedCount = 0;

    for (const block of searchReplaceBlocks) {
      const index = content.indexOf(block.search);
      if (index === -1) {
        return {
          success: false,
          output: "",
          error: `SEARCH block not found in file:\n${block.search.slice(0, 200)}`,
        };
      }
      content =
        content.slice(0, index) +
        block.replace +
        content.slice(index + block.search.length);
      appliedCount++;
    }

    const writeResult = await fs.writeFile(path, content);
    if (writeResult.error) {
      return { success: false, output: "", error: writeResult.error };
    }

    return {
      success: true,
      output: `Applied ${appliedCount} patch(es) to ${path}`,
      filesChanged: [path],
      metadata: { blocksApplied: appliedCount },
    };
  };
}

/** Create a run_command tool handler. */
export function createRunCommandTool(runner: ToolCommandRunner): ToolHandler {
  return async (args) => {
    const command = args.command as string;
    const cwd = args.cwd as string | undefined;
    const cmdArgs = (args.args as string[]) ?? [];

    const result = await runner.run(command, cmdArgs, cwd);

    const output = [
      result.stdout ? `STDOUT:\n${result.stdout}` : "",
      result.stderr ? `STDERR:\n${result.stderr}` : "",
      `Exit code: ${result.exitCode}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      success: result.exitCode === 0,
      output,
      error:
        result.exitCode !== 0
          ? `Command exited with code ${result.exitCode}`
          : undefined,
      metadata: { exitCode: result.exitCode },
    };
  };
}

// ── Helpers ──

interface SearchReplaceBlock {
  search: string;
  replace: string;
}

function parseSearchReplaceBlocks(diff: string): SearchReplaceBlock[] {
  const blocks: SearchReplaceBlock[] = [];
  const lines = diff.split("\n");

  let currentSearch: string[] = [];
  let currentReplace: string[] = [];
  let inSearch = false;
  let inReplace = false;

  for (const line of lines) {
    if (line.startsWith("------- SEARCH")) {
      inSearch = true;
      inReplace = false;
      currentSearch = [];
      continue;
    }
    if (line.startsWith("=======")) {
      inSearch = false;
      inReplace = true;
      currentReplace = [];
      continue;
    }
    if (line.startsWith("+++++++ REPLACE")) {
      inReplace = false;
      blocks.push({
        search: currentSearch.join("\n"),
        replace: currentReplace.join("\n"),
      });
      continue;
    }

    if (inSearch) currentSearch.push(line);
    if (inReplace) currentReplace.push(line);
  }

  return blocks;
}
