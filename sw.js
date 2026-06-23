// Minimal PWA service worker for installability.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network-first passthrough; required for the browser to recognize the
  // page as installable.
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});
