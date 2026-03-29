const CACHE_NAME = 'yuta-engine-v3.0'; // 버전을 v3.0으로 변경
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // 새 버전 즉시 적용
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => {
    return Promise.all(keys.map((key) => {
      if (key !== CACHE_NAME) return caches.delete(key); // 옛날 캐시 삭제
    }));
  }));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
