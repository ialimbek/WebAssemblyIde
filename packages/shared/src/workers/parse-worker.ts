export interface ParseWorkerRequest {
  id: string;
  kind: "markdown";
  content: string;
}

export interface ParseWorkerResponse {
  id: string;
  html: string;
}

self.onmessage = async (event: MessageEvent<ParseWorkerRequest>) => {
  const request = event.data;
  if (request.kind !== "markdown") return;
  const { marked } = await import("marked");
  self.postMessage({ id: request.id, html: await marked.parse(request.content) } satisfies ParseWorkerResponse);
};
