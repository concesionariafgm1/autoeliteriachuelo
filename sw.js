/* ============================================
   SERVICE WORKER - Stale While Revalidate
   Caching: HTML, CSS, JS, images
   Offline fallback support
   ============================================ */

const CACHE_NAME = 'autoelite-v1';
const OFFLINE_URL = 'offline.html';

const PRECACHE_URLS = [
  '/',
  'index.html',
  'vehiculos.html',
  'nosotros.html',
  'contacto.html',
  'offline.html',
  'css/style.css',
  'js/vehicles.js',
  'js/main.js',
  'manifest.json'
];

/* Install: precache core assets + offline page */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: stale-while-revalidate strategy */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cachedResponse) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(function() {
          /* Network failed: if navigating, show offline page */
          if (event.request.mode === 'navigate') {
            return cache.match(OFFLINE_URL);
          }
          return null;
        });

        /* Return cached version immediately, update in background */
        return cachedResponse || fetchPromise;
      });
    })
  );
});
