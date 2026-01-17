/* =====================================================
   SERVICE WORKER - OFFLINE FIRST
   ===================================================== */

const CACHE_NAME = "word-learning-cache-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js",
  "./manifest.json"
];

/* =========================
   INSTALAÇÃO
========================= */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/* =========================
   ATIVAÇÃO
========================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* =========================
   FETCH - OFFLINE FIRST
========================= */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        })
      );
    })
  );
});
