const CACHE_NAME = 'kizere-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Skip intercepting external domains that should not be cached
  // This includes Google APIs, Firebase, and other authentication-related URLs
  const externalDomains = [
    'apis.google.com',
    'accounts.google.com',
    'www.googleapis.com',
    'securetoken.googleapis.com',
    'identitytoolkit.googleapis.com',
    'firebaseinstallations.googleapis.com',
    'firebaseapp.com',
    'firebaseio.com',
    'gstatic.com'
  ];
  
  if (externalDomains.some(domain => url.hostname.includes(domain))) {
    // Let browser handle these requests directly without service worker intervention
    return;
  }

  // Network first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
           return new Response(JSON.stringify({ error: 'You are offline' }), {
             headers: { 'Content-Type': 'application/json' }
           });
        })
    );
    return;
  }

  // Stale-while-revalidate for static assets and pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache valid responses for http/https schemes only
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const scheme = new URL(event.request.url).protocol;
          if (scheme === 'http:' || scheme === 'https:') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      }).catch((err) => {
         // Network failed, return cached response if available
         return cachedResponse; 
      });
      
      return cachedResponse || fetchPromise;
    })
  );
});
