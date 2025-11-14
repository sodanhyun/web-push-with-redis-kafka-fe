const CACHE_NAME = 'my-toy-app-cache-v2'; // 캐시 이름을 변경하여 새 버전임을 명시
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/vite.svg'
];

// 1. 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // 설치 즉시 활성화 단계로 넘어갑니다.
        return self.skipWaiting();
      })
  );
});

// 2. 서비스 워커 활성화 및 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 현재 캐시 이름과 다른 이전 버전의 캐시를 모두 삭제합니다.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 활성화 즉시 클라이언트 제어권을 가져옵니다.
      return self.clients.claim();
    })
  );
});

// 3. 네트워크 요청 가로채기 (네트워크 우선, 실패 시 캐시 사용)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      console.log(`[Service Worker] 네트워크 요청 실패: ${event.request.url}. 캐시에서 응답을 시도합니다.`);
      return caches.match(event.request);
    })
  );
});

// 4. 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  const pushData = event.data ? event.data.json() : {};

  const title = pushData.title || '새로운 알림';
  const options = {
    body: pushData.body || '새로운 메시지가 도착했습니다.',
    icon: pushData.icon || '/vite.svg',
    badge: pushData.badge || '/vite.svg',
    data: {
      url: pushData.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 5. 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (new URL(client.url).pathname === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});