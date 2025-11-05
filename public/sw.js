// sw.js
const CACHE_NAME = 'my-toy-app-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/vite.svg'
  // 빌드 시 생성되는 JS/CSS 파일들은 동적으로 추가되거나, 런타임에 캐싱됩니다.
];

/**
 * @event install
 * @description 서비스 워커가 설치될 때 발생하는 이벤트입니다.
 *              앱 셸(핵심 자산)을 미리 캐싱하여 오프라인 지원을 준비합니다.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

/**
 * @event fetch
 * @description 네트워크 요청이 발생할 때마다 가로채는 이벤트입니다.
 *              캐시 우선 전략을 사용하여 응답합니다.
 */
self.addEventListener('fetch', (event) => {
  // API 요청이나 WebSocket 관련 요청은 캐시하지 않습니다.
  if (event.request.url.includes('/api') || event.request.url.includes('/ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 1. 캐시에 응답이 있으면 캐시된 응답을 반환합니다.
        if (response) {
          return response;
        }

        // 2. 캐시에 없으면 네트워크로 요청을 보냅니다.
        return fetch(event.request).then(
          (networkResponse) => {
            // 유효한 응답을 받으면 캐시에 저장하고 반환합니다.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});


// --- 기존 푸시 알림 로직 ---

/**
 * @event push
 * @description 서버로부터 푸시 메시지를 수신했을 때 발생하는 이벤트 리스너입니다.
 *              이벤트 데이터 파싱 후 시스템 알림을 표시합니다.
 */
self.addEventListener('push', (event) => {
  // 푸시 데이터를 저장할 객체와 알림 본문 기본값을 초기화합니다.
  let pushData = {};
  let notificationBody = '새로운 메시지가 도착했습니다.'; // 푸시 데이터에 본문이 없을 경우 사용될 기본 메시지

  // event.data (PushMessageData 객체)가 존재하는지 확인합니다.
  if (event.data) {
    try {
      // 1. 푸시 데이터를 JSON 형식으로 파싱을 시도합니다.
      pushData = event.data.json();
      // JSON 파싱에 성공하면, 파싱된 데이터에서 본문을 가져오거나 기본값을 사용합니다.
      notificationBody = pushData.body || pushData.message || notificationBody;
    } catch (e) {
      // 2. JSON 파싱에 실패하면, 데이터를 일반 텍스트로 처리합니다.
      notificationBody = event.data.text() || notificationBody;
      console.error('푸시 데이터를 JSON으로 파싱하는데 실패했습니다. 텍스트로 처리합니다:', e);
      // 일반 텍스트인 경우, pushData 객체는 본문만 포함하도록 재구성합니다.
      pushData = { body: notificationBody };
    }
  }

  // 알림의 제목을 설정합니다. pushData에 title이 없으면 기본값을 사용합니다.
  const title = pushData.title || '새로운 알림';

  // 알림 옵션의 `data` 속성에 사용될 객체를 미리 정의하여 `notificationId`를 보장합니다.
  const notificationDataForOptions = {
    url: pushData.url || '/', // 알림 클릭 시 이동할 URL (없으면 루트 경로)
    notificationId: pushData.notificationId || `notif-${Date.now()}` // 알림의 고유 ID (없으면 현재 타임스탬프 사용)
  };

  // `showNotification` 메서드에 전달될 알림 옵션 객체를 구성합니다.
  const options = {
    body: notificationBody, // 알림 본문
    // 아이콘 경로를 절대 URL로 변환합니다. (상대 경로 문제 방지)
    icon: pushData.icon ? new URL(pushData.icon, self.location.origin).href : new URL('/vite.svg', self.location.origin).href,
    // 배지 아이콘 경로를 절대 URL로 변환합니다. (상대 경로 문제 방지)
    badge: pushData.badge ? new URL(pushData.badge, self.location.origin).href : new URL('/vite.svg', self.location.origin).href,
    image: pushData.image, // 알림에 표시될 이미지 (선택 사항)
    // 알림 태그를 설정합니다. 고유한 태그를 사용하여 알림이 덮어쓰여지는 것을 방지합니다.
    tag: pushData.tag || notificationDataForOptions.notificationId,
    requireInteraction: pushData.requireInteraction || false, // 사용자가 닫을 때까지 알림 유지 여부
    data: notificationDataForOptions, // 알림과 관련된 추가 데이터
    actions: pushData.actions || [] // 알림에 표시될 액션 버튼들
  };

  // 알림을 표시하기 전에 디버깅을 위한 로그를 출력합니다.
  console.log('Service Worker: Attempting to show notification with title:', title);
  console.log('Service Worker: Notification options:', options);

  // `event.waitUntil`을 사용하여 서비스 워커가 알림 표시 작업을 완료할 때까지 활성 상태를 유지하도록 합니다.
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('Service Worker: Notification shown successfully.');
        // 알림이 성공적으로 표시되면, BroadcastChannel을 통해 메인 스레드에 알립니다.
        const bc = new BroadcastChannel('notification-channel');
        bc.postMessage({ type: 'NOTIFICATION_DISPLAYED', notification: options });
        bc.close(); // 채널 사용 후 닫기
      })
      .catch(err => {
        // 알림 표시 중 오류가 발생하면 콘솔에 에러를 로깅하고, 메인 스레드에 에러를 전달합니다.
        console.error('Service Worker: Failed to show notification. Error:', err);
        const bc = new BroadcastChannel('notification-channel');
        bc.postMessage({ type: 'NOTIFICATION_ERROR', error: err.message });
        bc.close(); // 채널 사용 후 닫기
      })
  );
});

/**
 * @event notificationclick
 * @description 사용자가 시스템 알림을 클릭했을 때 발생하는 이벤트 리스너입니다.
 *              알림을 닫고, 메인 스레드에 클릭 이벤트를 전달하며, 관련 URL로 이동합니다.
 */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification; // 클릭된 알림 객체
  const action = event.action; // 클릭된 액션 버튼의 ID (없으면 빈 문자열)

  // 알림을 닫습니다.
  notification.close();

  // BroadcastChannel을 통해 메인 스레드에 알림 클릭 이벤트를 전달합니다.
  // const bc = new BroadcastChannel('notification-channel');
  // bc.postMessage({ type: 'NOTIFICATION_CLICKED', action, notification });
  // bc.close(); // 채널 사용 후 닫기

  // 'dismiss' 액션 버튼이 클릭된 경우, 추가적인 페이지 이동 없이 함수를 종료합니다.
  if (action === 'dismiss') {
    return;
  }

  // 알림 데이터에 포함된 URL 또는 기본 루트 경로로 이동할 URL을 결정합니다.
  const urlToOpen = notification.data.url || '/';

  // `event.waitUntil`을 사용하여 서비스 워커가 URL 이동 작업을 완료할 때까지 활성 상태를 유지하도록 합니다.
  event.waitUntil(
    clients.matchAll({
      type: 'window', // 'window' 타입의 클라이언트(탭 또는 창)를 찾습니다.
      includeUncontrolled: true // 서비스 워커가 제어하지 않는 클라이언트도 포함합니다.
    }).then((clientList) => {
      // 1. 이미 해당 URL을 가진 탭이 열려있는지 확인하고, 있다면 그 탭에 포커스를 줍니다.
      for (const client of clientList) {
        // 클라이언트 URL과 타겟 URL의 경로를 정규화하여 비교합니다. (예: https://example.com/path/ 와 https://example.com/path 비교)
        const clientUrl = new URL(client.url).pathname;
        const targetUrl = new URL(urlToOpen, self.location.origin).pathname;
        if (clientUrl === targetUrl && 'focus' in client) {
          return client.focus(); // 기존 탭에 포커스
        }
      }
      // 2. 열려있는 탭이 없다면, 새 창(탭)으로 URL을 엽니다.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen); // 새 탭 열기
      }
    })
  );
});