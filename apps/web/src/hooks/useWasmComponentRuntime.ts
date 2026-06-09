import { useMemo } from "react";
import {
  detectLanguageForPath,
  findPlainTextMatches,
  joinPath,
  lastDelimitedLines,
  relativePath,
  scoreItemsByQuery,
  scoreMatch,
  type WasmPlainTextMatch,
  type WasmScoredItem,
} from "@webassembly-ide/wasm-shared";

export interface WasmComponentRuntime {
  scoreMatch: typeof scoreMatch;
  scoreItemsByQuery: typeof scoreItemsByQuery;
  detectLanguageForPath: typeof detectLanguageForPath;
  joinPath: typeof joinPath;
  relativePath: typeof relativePath;
  lastDelimitedLines: typeof lastDelimitedLines;
  findPlainTextMatches: typeof findPlainTextMatches;
}

export type { WasmPlainTextMatch, WasmScoredItem };

/**
 * Single React hook boundary for component-local WASM acceleration.
 * React stays responsible for rendering/state; pure compute goes through WASM.
 */
export function useWasmComponentRuntime(): WasmComponentRuntime {
  return useMemo(
    () => ({
      scoreMatch,
      scoreItemsByQuery,
      detectLanguageForPath,
      joinPath,
      relativePath,
      lastDelimitedLines,
      findPlainTextMatches,
    }),
    [],
  );
}
