const CACHE = 'moneyflows-v2';
const PRECACHE = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request, fallbackToIndex = false) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackToIndex) {
      const index = await cache.match('/index.html');
      if (index) return index;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok && fresh.type === 'basic') {
    const cache = await caches.open(CACHE);
    cache.put(request, fresh.clone());
  }
  return fresh;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Vite content-hashed bundles are immutable -> safe to serve from cache forever.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(cacheFirst(req));
    return;
  }

  // Navigations and everything else (index.html, sw.js, wasm, icons):
  // network-first so updates always reach the client; cache is the offline fallback.
  e.respondWith(networkFirst(req, req.mode === 'navigate'));
});
