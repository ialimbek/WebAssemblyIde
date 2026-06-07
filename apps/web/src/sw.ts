/// <reference lib="webworker" />

export {};

const CACHE_NAME = "codembly-app-shell-v1";
const APP_SHELL = ["/", "/index.html"];
const serviceWorker = self as unknown as ServiceWorkerGlobalScope;

serviceWorker.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

serviceWorker.addEventListener("fetch", (event: FetchEvent) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      if (request.url.includes("vendor-monaco") || request.url.endsWith(".wasm")) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
