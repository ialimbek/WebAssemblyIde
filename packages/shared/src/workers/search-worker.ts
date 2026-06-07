import { findPlainTextMatches, type WasmPlainTextMatch } from "@webassembly-ide/wasm-shared";

export interface SearchWorkerRequest {
  id: string;
  files: Array<{ path: string; content: string }>;
  query: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  limit?: number;
}

export interface SearchWorkerResponse {
  id: string;
  results: Array<{ path: string; matches: WasmPlainTextMatch[] }>;
}

self.onmessage = (event: MessageEvent<SearchWorkerRequest>) => {
  const request = event.data;
  const results: SearchWorkerResponse["results"] = [];
  let remaining = request.limit ?? 500;

  for (const file of request.files) {
    if (remaining <= 0) break;
    const matches = findPlainTextMatches(file.content, request.query, {
      caseSensitive: request.caseSensitive,
      wholeWord: request.wholeWord,
      limit: remaining,
    });
    if (matches.length > 0) {
      results.push({ path: file.path, matches });
      remaining -= matches.length;
    }
  }

  self.postMessage({ id: request.id, results } satisfies SearchWorkerResponse);
};
