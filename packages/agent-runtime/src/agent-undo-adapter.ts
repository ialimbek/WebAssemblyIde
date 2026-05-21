/**
 * Agent undo integration.
 *
 * Bridges Agent Runtime tool results to the IDE UndoRedoManager without letting
 * the agent mutate workspace state directly. Tools execute through Tool Registry;
 * this adapter only records reversible metadata after successful tool execution.
 */

import type { UndoRedoManager } from "@webassembly-ide/ide-core";
import type { AgentToolUndoMetadata, ToolCall, ToolResult } from "./types";
import type { AgentUndoAdapter } from "./agent-orchestrator";

export interface AgentUndoFileAdapter {
  writeFile(path: string, content: string): Promise<void>;
}

export interface AgentUndoManagerAdapterConfig {
  undoRedo: UndoRedoManager;
  fileAdapter: AgentUndoFileAdapter;
}

export class AgentUndoManagerAdapter implements AgentUndoAdapter {
  private readonly undoRedo: UndoRedoManager;
  private readonly fileAdapter: AgentUndoFileAdapter;

  constructor(config: AgentUndoManagerAdapterConfig) {
    this.undoRedo = config.undoRedo;
    this.fileAdapter = config.fileAdapter;
  }

  pushAgentAction(entry: {
    description: string;
    toolCall: ToolCall;
    result: ToolResult;
    undoMetadata: AgentToolUndoMetadata;
  }): void {
    const { undoMetadata } = entry;

    if (!isFileContentUndo(undoMetadata)) return;

    this.undoRedo.push({
      type: "agentPatch",
      description: entry.description,
      source: "agent",
      affectedPaths: [undoMetadata.path],
      undo: async () => {
        await this.fileAdapter.writeFile(
          undoMetadata.path,
          undoMetadata.beforeContent,
        );
      },
      redo: async () => {
        await this.fileAdapter.writeFile(
          undoMetadata.path,
          undoMetadata.afterContent,
        );
      },
    });
  }
}

function isFileContentUndo(
  undoMetadata: AgentToolUndoMetadata,
): undoMetadata is AgentToolUndoMetadata & {
  path: string;
  beforeContent: string;
  afterContent: string;
} {
  return (
    (undoMetadata.type === "fileWrite" || undoMetadata.type === "filePatch") &&
    typeof undoMetadata.path === "string" &&
    typeof undoMetadata.beforeContent === "string" &&
    typeof undoMetadata.afterContent === "string"
  );
}
