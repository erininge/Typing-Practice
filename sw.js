// Service Worker (GitHub Pages-safe, update-friendly)
const VERSION = "v1.2.19";
const CACHE_NAME = `typing-practice-${VERSION}`;
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return cache.match("./index.html");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok && request.method === "GET") {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    cacheFirst(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(request);
    })
  );
});

/*
Deploy checklist:
1) Bump VERSION on each deploy (or auto-bump from your build/CI commit SHA).
2) Hard-reset stuck SW: DevTools -> Application -> Service Workers -> Unregister,
   then Clear storage/site data and reload.
*/
