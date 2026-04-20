/**
 * Optimized Service Worker - Smart Caching with Proper Versioning
 */

const CACHE_VERSION = 'v2.1.0-polygon-optimized';
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
  
  // SSRF Protection - validate request URL
  if (!isValidUrl(url)) {
    return new Response('Invalid request', { status: 400 });
  }
  
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
  
  // Everything else - network first with validation
  try {
    const response = await fetch(request);
    return response;
  } catch {
    return new Response('Request failed', { status: 503 });
  }
}

// SSRF Protection - validate URLs
function isValidUrl(url) {
  // Only allow HTTPS and same-origin requests
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return false;
  }
  
  // Block private/local networks
  const hostname = url.hostname;
  if (hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.includes('169.254.') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return false;
  }
  
  // Additional SSRF protection - only allow specific domains
  const allowedDomains = [
    self.location.hostname, // Same origin
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'polygon-mainnet.g.alchemy.com',
    'apechain.calderachain.xyz',
    'verify.walletconnect.org',
    'verify.walletconnect.com',
    'explorer-api.walletconnect.com',
    'relay.walletconnect.org',
    'relay.walletconnect.com'
  ];
  
  // Check if domain is in allowlist
  const isAllowed = allowedDomains.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
  
  return isAllowed;
}