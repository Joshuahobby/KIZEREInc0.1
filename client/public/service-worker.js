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
      }).catch(() => {
        // Network failed, return cached response if available, otherwise return an offline fallback
        if (cachedResponse) {
          return cachedResponse;
        }
        // Return a proper offline response to prevent "Failed to convert value to Response" errors
        return new Response('Offline - resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/generated-icon.png',
      badge: '/generated-icon.png',
      data: data.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'KIZERE', options)
    );
  } catch (error) {
    console.error('Error in push event:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync Handling
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-kizere-data') {
    event.waitUntil(processPendingSyncs());
  }
});

async function processPendingSyncs() {
  const db = await openOfflineDB();
  const tx = db.transaction('pending-syncs', 'readwrite');
  const store = tx.objectStore('pending-syncs');

  // Use a temporary request to get all items since SW environment might be restricted
  const items = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  for (const item of items) {
    try {
      await syncItem(item);
      await new Promise((resolve, reject) => {
        const delRequest = store.delete(item.id);
        delRequest.onerror = () => reject(delRequest.error);
        delRequest.onsuccess = () => resolve();
      });
      console.log(`[SW Sync] Successfully synced item: ${item.id}`);
    } catch (error) {
      console.error(`[SW Sync] Failed to sync item: ${item.id}`, error);
      // Item stays in DB to be retried next time
    }
  }
}

async function syncItem(item) {
  let url = '';
  // Convert object back to headers if needed
  const headers = {
    'Content-Type': 'application/json'
  };

  const options = {
    method: 'POST',
    headers,
    body: JSON.stringify(item.data)
  };

  switch (item.type) {
    case 'CREATE_ITEM':
      url = '/api/items';
      break;
    case 'CREATE_REPORT':
      url = '/api/reports';
      break;
    case 'SEND_MESSAGE':
      url = `/api/chats/${item.data.chatId}/messages`;
      break;
    default:
      return;
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Sync failed with status: ${response.status}`);
  }
}

// Minimal IndexedDB helpers for SW
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kizere-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
