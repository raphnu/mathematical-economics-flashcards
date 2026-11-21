// Offline support. Serves the cached app instantly, then refreshes the cache in the
// background, so a new upload appears the second time the app is opened.
// VERSION is filled in by build_app.py from a hash of the app files, so every rebuild
// with changed content gets a fresh cache automatically.
const VERSION = "cards-33dcacb465";
const FILES = ["./", "index.html", "styles.css", "app.js", "deck.js", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"];
const CDN = "https://cdn.jsdelivr.net/";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (e.request.method !== "GET") return;
  if (new URL(url).origin !== location.origin && !url.startsWith(CDN)) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then(res => { if (res.ok || res.type === "opaque") cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
