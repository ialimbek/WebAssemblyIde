export interface GitWorkerRequest {
  id: string;
  kind: "summarize-status";
  entries: Array<{ path: string; status: string }>;
}

export interface GitWorkerResponse {
  id: string;
  counts: Record<string, number>;
}

self.onmessage = (event: MessageEvent<GitWorkerRequest>) => {
  const counts: Record<string, number> = {};
  for (const entry of event.data.entries) {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
  }
  self.postMessage({ id: event.data.id, counts } satisfies GitWorkerResponse);
};
