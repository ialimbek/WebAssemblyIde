import { scoreItemsByQuery, type WasmScoredItem } from "@webassembly-ide/wasm-shared";

export interface FuzzyWorkerRequest {
  id: string;
  candidates: string[];
  query: string;
  limit?: number;
  caseSensitive?: boolean;
}

export interface FuzzyWorkerResponse {
  id: string;
  results: WasmScoredItem[];
}

self.onmessage = (event: MessageEvent<FuzzyWorkerRequest>) => {
  const request = event.data;
  self.postMessage({
    id: request.id,
    results: scoreItemsByQuery(
      request.candidates,
      request.query,
      request.limit ?? 500,
      request.caseSensitive ?? false,
    ),
  } satisfies FuzzyWorkerResponse);
};
