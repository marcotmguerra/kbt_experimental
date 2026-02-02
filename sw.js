const CACHE_NAME = 'sae-v1';
const assets = [
  '/paginas/login.html',
  '/css/base.css',
  '/css/admin.css',
  '/js/supabaseCliente.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});