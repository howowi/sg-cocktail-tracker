const CACHE_NAME = 'sg50-bars-v6';

const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './bars-data.js',
  './app.js',
  './manifest.webmanifest',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cache-first for immutable assets/icons; network-first with cache fallback for HTML/JS/CSS & OneMap tiles
  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/assets/')) {
      event.respondWith(
        caches.match(req).then(cached => cached || fetch(req).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        }))
      );
    } else {
      event.respondWith(
        fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => caches.match(req))
      );
    }
  } else {
    event.respondWith(
      fetch(req).then(res => {
        if (res.ok && (url.hostname.includes('onemap.gov.sg') || url.hostname.includes('unpkg') || url.hostname.includes('fonts'))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
