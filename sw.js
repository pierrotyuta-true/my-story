const CACHE_NAME = 'story-master-v1.3'; // 버전을 계속 올려주세요 (v1.2 -> v1.3)
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// 설치 시점에 캐시 저장
self.addEventListener('install', (e) => {
  self.skipWaiting(); // 즉시 활성화
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 예전 버전 캐시 삭제
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

// 네트워크 우선 전략 (인터넷 연결 시 새 파일 우선)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
