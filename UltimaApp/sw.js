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
    // Network-first for JS files (always get fresh code), cache-first for CDN assets
    const url = new URL(e.request.url);
    if (url.pathname.endsWith('.js') && url.origin === self.location.origin) {
        // Network-first for local JS files
        e.respondWith(
            fetch(e.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return response;
            }).catch(() => caches.match(e.request))
        );
    } else {
        // Cache-first for external CDN assets
        e.respondWith(
            caches.match(e.request).then((response) => response || fetch(e.request))
        );
    }
});
