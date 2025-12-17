// Lightweight service worker for performance optimization
const CACHE_NAME = 'apechain-raffles-v1';
const STATIC_CACHE = [
  '/',
  '/static/css/main.css',
  '/favicon.ico'
];

// SSRF Protection: URL validation
function isAllowedURL(url) {
  const allowedHosts = [
    'apechainraffles.io',
    'apechain.calderachain.xyz',
    'localhost',
    '127.0.0.1'
  ];
  
  // Block private IP ranges
  const privateIPs = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fe80:)/;
  if (privateIPs.test(url.hostname)) {
    return false;
  }
  
  // Allow only HTTPS in production, HTTP for localhost
  if (url.protocol !== 'https:' && !url.hostname.includes('localhost') && url.hostname !== '127.0.0.1') {
    return false;
  }
  
  return allowedHosts.some(host => 
    url.hostname === host || url.hostname.endsWith('.' + host)
  );
}

// Install event - cache critical resources with error handling
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('[SW-Lite] Failed to cache resources:', error);
        // Re-throw to prevent faulty installation
        throw error;
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network with security
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) return;
  
  // SSRF Protection: Validate URL
  const url = new URL(event.request.url);
  if (!isAllowedURL(url)) {
    console.warn('[SW-Lite] Blocked potentially malicious URL:', url.href);
    event.respondWith(new Response('Blocked', { status: 403 }));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(async () => {
        // Enhanced offline fallback
        if (event.request.destination === 'document') {
          const offlinePage = await caches.match('/');
          return offlinePage || new Response('Offline', { status: 503 });
        }
        
        // Fallback for other resources
        return new Response('Resource unavailable', { status: 404 });
      })
  );
});