const CACHE_NAME = 'pocket-finance-v8';
const ASSETS = [
    './',
    './index.html',
    './js/app.js',
    './js/auth.js',
    './js/i18n.js',
    './js/router.js',
    './js/store.js',
    './js/ui.js',
    './js/supa-client.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // Activate immediately, don't wait
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    // Delete old caches so stale files are never served
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // 1. BYPASS SUPABASE (CRITICAL FIX)
    // Don't let SW touch API requests. Let browser handle CORS/Network directly.
    if (url.hostname.includes('supabase.co')) {
        return; // Return nothing = browser performs default fetch
    }

    // 2. NETWORK-FIRST for Local JS (Dev experience)
    if (url.pathname.endsWith('.js') && url.origin === self.location.origin) {
        e.respondWith(
            fetch(e.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return response;
            }).catch(() => caches.match(e.request))
        );
        return;
    }

    // 3. CACHE-FIRST for CDNs & Assets (Performance)
    // Only engage cache for known static assets or CDNs (excluding Supabase)
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
