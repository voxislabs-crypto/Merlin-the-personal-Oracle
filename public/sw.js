/* Merlin PWA Service Worker */

// Bump version to force reinstall and clear old bad caches
const CACHE_NAME = 'merlin-static-v3';

// Only cache the public landing page and critical static assets.
// Auth-protected routes (/dashboard, /enhanced-dashboard, etc.) MUST NOT be
// pre-cached: Clerk redirects them to /sign-in, which makes cache.addAll()
// fail and causes "redirect mode not follow" errors.
const STATIC_ASSETS = [
  '/',
];

// Routes that require Clerk authentication — the SW must never intercept these.
// Let the browser handle Clerk's redirects natively.
const PROTECTED_PATHS = [
  '/dashboard',
  '/profile',
  '/settings',
  '/enhanced-dashboard',
  '/soul-dashboard',
  '/sign-in',
  '/sign-up',
  '/oracle-chat',
  '/time-machine',
];

function isProtectedPath(pathname) {
  return PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

// Install event — cache only the public landing page
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        // Use individual adds so a single failure doesn't abort the whole install
        return Promise.all(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn('[SW] Failed to cache:', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event — purge all old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests over http(s)
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Don't intercept cross-origin requests (Clerk, Stripe, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // ── Auth-protected pages ──────────────────────────────────────────────────
  // These are handled by Clerk middleware which issues redirects.
  // If the SW intercepts them it breaks redirect-mode and causes mixed-content
  // errors when Clerk generates http:// redirect URLs.
  if (isProtectedPath(url.pathname)) return;

  // ── API routes ────────────────────────────────────────────────────────────
  // All /api/* calls are authenticated, dynamic, and must never be cached.
  // Intercepting them in the SW was causing ERR_INSUFFICIENT_RESOURCES when
  // the dashboard fired 7+ parallel authenticated requests on load.
  if (url.pathname.startsWith('/api/')) return;

  // ── manifest.json ─────────────────────────────────────────────────────────
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(request).catch(() => new Response('{}', {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // ── Navigation requests (page loads) ─────────────────────────────────────
  // Use network-first so that fresh HTML is always served.
  // Do NOT cache navigation responses to avoid storing stale pages.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { redirect: 'follow' })
        .catch(error => {
          console.log('[SW] Navigation fetch failed:', error);
          // Offline fallback: return cached home page
          return caches.match('/') ||
            new Response('<h1>You are offline</h1>', {
              status: 503,
              headers: { 'Content-Type': 'text/html' },
            });
        })
    );
    return;
  }

  // ── Static assets (JS, CSS, fonts, images) ────────────────────────────────
  // Cache-first with background revalidation (stale-while-revalidate).
  // Only cache non-redirected, successful responses.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Serve from cache; refresh in background
        fetch(request).then(response => {
          if (response.ok && !response.redirected) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(request)
        .then(response => {
          if (response.ok && !response.redirected) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(error => {
          console.log('[SW] Fetch failed:', error);
          return new Response('Network error', { status: 503 });
        });
    })
  );
});

// Message event - commands from client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      })
    );
  }
});
