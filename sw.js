self.addEventListener('install', (p) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (p) => {
  p.respondWith(fetch(p.request));
});
