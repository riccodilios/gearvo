/* Gearvo PWA — offline shell only. Never cache Next.js documents/chunks (avoids ChunkLoadError after deploys). */
const CACHE = 'gearvo-shell-v2';
const SHELL = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Next assets, RSC, or auth — must always hit the network
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/sign-') ||
    url.pathname.startsWith('/welcome') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1' ||
    request.destination === 'document'
  ) {
    return;
  }

  // Icons / manifest only: cache-first
  if (!SHELL.some((p) => url.pathname === p || url.pathname.endsWith(p))) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      });
    })
  );
});
