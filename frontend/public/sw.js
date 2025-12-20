/**
 * Optimized Service Worker - Smart Caching with Proper Versioning
 */

const CACHE_VERSION = 'v2.0.0-optimized';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Install - cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(['/']))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => 
        Promise.all(
          cacheNames
            .filter(name => !name.includes(CACHE_VERSION))
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch - network first for HTML, cache first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // HTML - always network first
  if (request.headers.get('accept')?.includes('text/html')) {
    try {
      const response = await fetch(request);
      return response;
    } catch {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
  }
  
  // Static assets - cache first
  if (/\.(js|css|png|jpg|svg|ico|woff2?)$/.test(url.pathname)) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response('Asset unavailable', { status: 404 });
    }
  }
  
  // Everything else - network first
  return fetch(request);
}