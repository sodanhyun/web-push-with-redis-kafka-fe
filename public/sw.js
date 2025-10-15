// 서비스워커 등록 및 푸시 알림 처리
const CACHE_NAME = 'my-toy-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// 서비스워커 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
  );
});

// 서비스워커 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// 푸시 이벤트 처리
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  // 기본 알림 데이터
  let notificationData = {
    title: '새로운 알림',
    body: '새로운 메시지가 도착했습니다.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    image: null,
    tag: 'default-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    url: '/',
    actions: [
      {
        action: 'view',
        title: '보기',
        icon: '/vite.svg'
      },
      {
        action: 'dismiss',
        title: '닫기'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now(),
      notificationId: null
    }
  };

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Service Worker: Parsed push data:', pushData);
      
      // 푸시 데이터를 알림 데이터로 매핑
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || pushData.message || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        image: pushData.image || notificationData.image,
        tag: pushData.tag || `notification-${Date.now()}`,
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false,
        vibrate: pushData.vibrate || notificationData.vibrate,
        url: pushData.url || pushData.click_action || notificationData.url,
        actions: pushData.actions || notificationData.actions,
        data: {
          ...notificationData.data,
          ...pushData.data,
          url: pushData.url || pushData.click_action || notificationData.url,
          timestamp: Date.now(),
          notificationId: pushData.notificationId || `notif-${Date.now()}`,
          category: pushData.category || 'general',
          priority: pushData.priority || 'normal'
        }
      };
    } catch (error) {
      console.error('Service Worker: Error parsing push data:', error);
      // JSON 파싱 실패 시 텍스트로 처리
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // 알림 표시 옵션 구성
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    image: notificationData.image,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: notificationData.vibrate,
    timestamp: notificationData.timestamp,
    actions: notificationData.actions,
    data: notificationData.data
  };

  console.log('Service Worker: Showing notification with options:', notificationOptions);

  // 알림 표시
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log('Service Worker: Notification displayed successfully');
        
        // 메인 스레드에 알림 표시 완료 메시지 전송
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => {
        // 모든 클라이언트에 알림 표시 완료 메시지 전송
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_DISPLAYED',
            notificationId: notificationData.data.notificationId,
            title: notificationData.title,
            body: notificationData.body,
            timestamp: notificationData.timestamp
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker: Failed to show notification:', error);
      })
  );
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data || {};
  
  // 알림 닫기
  notification.close();

  // 메인 스레드에 알림 클릭 이벤트 전송
  const clickData = {
    type: 'NOTIFICATION_CLICKED',
    action: action,
    notificationId: notificationData.notificationId,
    title: notification.title,
    body: notification.body,
    url: notificationData.url,
    timestamp: notificationData.timestamp,
    category: notificationData.category,
    priority: notificationData.priority
  };

  console.log('Service Worker: Sending click event to main thread:', clickData);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 모든 클라이언트에 알림 클릭 이벤트 전송
        clientList.forEach(client => {
          client.postMessage(clickData);
        });

        // 액션별 처리
        if (action === 'dismiss') {
          console.log('Service Worker: Notification dismissed');
          return;
        }

        // 'view' 액션이거나 기본 클릭
        const urlToOpen = notificationData.url || '/';
        
        // 이미 열린 탭이 있는지 확인
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            console.log('Service Worker: Focusing existing tab');
            return client.focus();
          }
        }
        
        // 새 탭 열기
        if (clients.openWindow) {
          console.log('Service Worker: Opening new tab:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('Service Worker: Error handling notification click:', error);
      })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync');
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // 백그라운드에서 실행할 작업
  return Promise.resolve();
}

// 메시지 이벤트 처리 (메인 스레드와 통신)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('Service Worker: Skipping waiting...');
      self.skipWaiting();
      break;
      
    case 'GET_NOTIFICATION_PERMISSION':
      // 알림 권한 상태 확인 요청
      event.ports[0]?.postMessage({
        type: 'NOTIFICATION_PERMISSION_STATUS',
        permission: Notification.permission
      });
      break;
      
    case 'SEND_TEST_NOTIFICATION':
      // 테스트 알림 전송 요청
      const testNotificationData = {
        title: data?.title || '테스트 알림',
        body: data?.body || '이것은 테스트 알림입니다.',
        icon: data?.icon || '/vite.svg',
        tag: `test-${Date.now()}`,
        data: {
          url: data?.url || '/',
          timestamp: Date.now(),
          notificationId: `test-${Date.now()}`,
          category: 'test',
          priority: 'normal'
        }
      };
      
      self.registration.showNotification(testNotificationData.title, testNotificationData)
        .then(() => {
          console.log('Service Worker: Test notification sent');
          event.ports[0]?.postMessage({
            type: 'TEST_NOTIFICATION_SENT',
            success: true
          });
        })
        .catch((error) => {
          console.error('Service Worker: Failed to send test notification:', error);
          event.ports[0]?.postMessage({
            type: 'TEST_NOTIFICATION_SENT',
            success: false,
            error: error.message
          });
        });
      break;
      
    case 'CLEAR_ALL_NOTIFICATIONS':
      // 모든 알림 클리어 요청
      self.registration.getNotifications()
        .then((notifications) => {
          notifications.forEach(notification => notification.close());
          console.log('Service Worker: All notifications cleared');
          event.ports[0]?.postMessage({
            type: 'NOTIFICATIONS_CLEARED',
            count: notifications.length
          });
        });
      break;
      
    case 'GET_NOTIFICATION_COUNT':
      // 현재 알림 개수 조회 요청
      self.registration.getNotifications()
        .then((notifications) => {
          event.ports[0]?.postMessage({
            type: 'NOTIFICATION_COUNT',
            count: notifications.length
          });
        });
      break;
      
    default:
      console.log('Service Worker: Unknown message type:', type);
  }
});
