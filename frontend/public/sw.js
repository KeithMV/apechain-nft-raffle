/**
 * Professional Service Worker for Performance Optimization
 * Implements caching strategies for static assets and API responses
 */

const CACHE_NAME = 'apechain-raffles-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/css/main.css',
  '/manifest.json',
  // Add critical assets only
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - Cache first
  static: [
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
    /\/static\//
  ],
  
  // API responses - Network first with fallback
  api: [
    /\/api\//,
    /apechain\.calderachain\.xyz/,
    /ipfs\.io/,
    /dweb\.link/
  ],
  
  // Images - Cache first with network fallback
  images: [
    /\.(?:png|jpg|jpeg|gif|svg|webp)$/,
    /cdn\.other\.page/,
    /nftstorage\.link/
  ]
};

// Install event - cache critical assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets - Cache first
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Images - Cache first with network fallback
    if (isImage(url)) {
      return await cacheFirst(request, DYNAMIC_CACHE);
    }
    
    // API calls - Network first with cache fallback
    if (isApiCall(url)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Default - Network first
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Request failed:', error);
    
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    updateCache(request, cacheName);
    return cachedResponse;
  }
  
  return await fetchAndCache(request, cacheName);
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      await cacheResponse(request, response.clone(), cacheName);
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Helper functions
async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  
  if (response.ok) {
    await cacheResponse(request, response.clone(), cacheName);
  }
  
  return response;
}

async function cacheResponse(request, response, cacheName) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

async function updateCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse(request, response, cacheName);
    }
  } catch (error) {
    // Ignore background update errors
    console.log('[SW] Background update failed:', error.message);
  }
}

// URL classification helpers
function isStaticAsset(url) {
  return CACHE_STRATEGIES.static.some(pattern => pattern.test(url.pathname));
}

function isImage(url) {
  return CACHE_STRATEGIES.images.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.hostname)
  );
}

function isApiCall(url) {
  return CACHE_STRATEGIES.api.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.hostname)
  );
}

// Message handling for cache management
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}