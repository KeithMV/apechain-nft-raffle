/**
 * Optimized Service Worker for ApeChain Raffles
 * Phase C Performance Optimization
 */

const CACHE_NAME = 'apechain-raffles-v1.2';
const STATIC_CACHE = 'static-v1.2';
const DYNAMIC_CACHE = 'dynamic-v1.2';
const IMAGE_CACHE = 'images-v1.2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/css/main.css',
  '/manifest.json',
  '/placeholder-nft.svg'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for images
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        // Only cache trusted static assets during install
        const trustedAssets = STATIC_ASSETS.filter(asset => 
          asset.startsWith('/') && !asset.includes('..')
        );
        return cache.addAll(trustedAssets);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // Validate cache names before deletion to prevent CSRF
        const validCacheNames = cacheNames.filter(cacheName => 
          typeof cacheName === 'string' && 
          cacheName.match(/^[a-zA-Z0-9\-_.]+$/) &&
          cacheName !== STATIC_CACHE && 
          cacheName !== DYNAMIC_CACHE && 
          cacheName !== IMAGE_CACHE
        );
        return Promise.all(
          validCacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// URL validation for SSRF protection
function isAllowedURL(url) {
  const allowedHosts = [
    'apechainraffles.io',
    'apechain.calderachain.xyz',
    'localhost',
    '127.0.0.1'
  ];
  
  // Block private IP ranges
  const privateIPs = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/;
  if (privateIPs.test(url.hostname)) {
    return false;
  }
  
  // Allow only HTTPS in production, HTTP for localhost
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return false;
  }
  
  return allowedHosts.some(host => 
    url.hostname === host || url.hostname.endsWith('.' + host)
  );
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // CSRF Protection: Only handle GET requests and validate origin
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    if (!origin && !referer) {
      event.respondWith(new Response('CSRF: Missing origin', { status: 403 }));
      return;
    }
    
    if (origin) {
      const originUrl = new URL(origin);
      if (!isAllowedURL(originUrl)) {
        event.respondWith(new Response('CSRF: Invalid origin', { status: 403 }));
        return;
      }
    }
    
    return;
  }
  
  // SSRF Protection: Validate URL
  if (!isAllowedURL(url)) {
    event.respondWith(new Response('Blocked', { status: 403 }));
    return;
  }

  // Handle different resource types
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  } else if (isAPICall(url)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Cache strategies implementation
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    // URL already validated in main fetch handler
    const response = await fetch(request);
    if (response.ok) {
      // CSRF Protection: Validate request before caching
      const requestUrl = new URL(request.url);
      if (isAllowedURL(requestUrl)) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    // URL already validated in main fetch handler
    const response = await fetch(request);
    if (response.ok) {
      // CSRF Protection: Validate request before caching
      const requestUrl = new URL(request.url);
      if (isAllowedURL(requestUrl)) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // URL already validated in main fetch handler
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      // CSRF Protection: Validate request before caching
      const requestUrl = new URL(request.url);
      if (isAllowedURL(requestUrl)) {
        cache.put(request, response.clone());
      }
    }
    return response;
  }).catch(() => null);
  
  return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.includes('/static/') || 
         url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

function isImage(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
         url.hostname.includes('ipfs') ||
         url.hostname.includes('gateway');
}

function isAPICall(url) {
  return url.pathname.includes('/api/') ||
         url.hostname.includes('apechain') ||
         url.hostname.includes('rpc');
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when back online
  console.log('Background sync triggered');
}

// Push notifications (future feature)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});