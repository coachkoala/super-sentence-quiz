// Service worker for offline play. Strategy: precache the whole app shell +
// data on install, then serve stale-while-revalidate on every GET — cached
// response returns instantly, a background fetch refreshes the cache for
// next time. Bump CACHE_NAME only when this file's own logic changes;
// regular content/code updates are picked up automatically via the
// background revalidation on the next online visit.

const CACHE_NAME = 'ssq-cache-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/dom.js',
  '/js/logic.js',
  '/js/render.js',
  '/js/share.js',
  '/js/sound.js',
  '/js/storage.js',
  '/js/dataLoader.js',
  '/data/sentences.json',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // allSettled, not addAll: one flaky resource (e.g. the CDN script)
      // shouldn't sink the whole precache.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const update = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(update);
        return cached;
      }
      return update.then((res) => res || caches.match('/index.html'));
    })
  );
});
