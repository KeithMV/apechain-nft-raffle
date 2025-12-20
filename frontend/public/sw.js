/**
 * Service Worker DISABLED for mobile cache debugging
 * This will force mobile browsers to fetch fresh content
 */

// Immediately unregister any existing service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Don't cache anything - pass through all requests
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});