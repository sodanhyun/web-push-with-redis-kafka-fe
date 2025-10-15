# 푸시 알림 데모 앱

React + TypeScript + Vite로 구축된 푸시 알림 데모 애플리케이션입니다.

## 🚀 주요 기능

- **서비스워커 기반 푸시 알림**: 백그라운드에서 푸시 이벤트 처리
- **HTTPS 로컬 개발 환경**: SSL 인증서 자동 생성 및 설정
- **Vite 프록시 설정**: CORS 문제 해결을 위한 백엔드 API 프록시
- **실시간 알림 UI**: 토스트 알림 및 브라우저 네이티브 알림
- **완전한 푸시 알림 시스템**: 권한 요청, 구독, 토큰 전송, 알림 표시

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: CSS3 (Glassmorphism 디자인)
- **HTTP Client**: Axios
- **Push Notifications**: Service Worker, Push API, Notification API
- **Development**: HTTPS, Proxy, Hot Reload

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. HTTPS 인증서 생성

#### 🎯 권장: mkcert 사용 (정상적인 인증서)

```bash
# mkcert 설치 후 실행 (브라우저 경고 없음)
npm run setup:https:mkcert

# Windows 사용자
npm run setup:https:mkcert:win
```

**mkcert 설치 방법:**
- **Windows**: `choco install mkcert` 또는 [수동 다운로드](https://github.com/FiloSottile/mkcert/releases)
- **macOS**: `brew install mkcert`
- **Linux**: `sudo apt install libnss3-tools` 후 [수동 설치](https://github.com/FiloSottile/mkcert/releases)

#### 🔧 대안: 자체 서명 인증서

```bash
# 자동 생성 (node-forge 사용, 브라우저 경고 있음)
npm run setup:https

# OpenSSL 사용 (OpenSSL이 설치된 경우)
npm run setup:https:openssl

# Windows 사용자 (OpenSSL 설치 필요)
npm run setup:https:win
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.development` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 개발 환경 설정
NODE_ENV=development

# API 설정
VITE_API_BASE_URL=http://localhost:3001
VITE_PUSH_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# VAPID 키 (개발용)
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa40HI8p8KJguxQn4X4VXH9B8wP3ZWhN36yK10Mxhm0V8FId0U8nXjWQ9XNSHg
```

### 4. 개발 서버 실행

```bash
# HTTPS로 실행 (권장)
npm run dev:https

# HTTP로 실행
npm run dev
```

### 5. 브라우저에서 접속

- **HTTPS**: `https://localhost:5173`
- **HTTP**: `http://localhost:5173`

HTTPS 접속 시 브라우저에서 "고급" → "localhost로 이동(안전하지 않음)"을 클릭하여 진행하세요.

## 🎯 사용법

1. **권한 요청**: "권한 요청" 버튼을 클릭하여 알림 권한을 허용하세요.
2. **푸시 구독**: "푸시 알림 구독" 버튼을 클릭하여 구독을 시작하세요.
3. **테스트**: 다양한 테스트 버튼으로 알림 기능을 테스트하세요.

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev              # HTTP 모드
npm run dev:https        # HTTPS 모드

# 빌드
npm run build

# 미리보기
npm run preview          # HTTP 모드
npm run preview:https    # HTTPS 모드

# HTTPS 설정
npm run setup:https:mkcert    # mkcert 인증서 생성 (권장)
npm run setup:https           # 자체 서명 인증서 생성
npm run setup:https:openssl   # OpenSSL 인증서 생성
npm run clean:certs           # 인증서 삭제

# 린팅
npm run lint
```

## 🌐 프록시 설정

Vite 프록시를 통해 백엔드 API와 통신합니다:

## 📱 브라우저 지원

- Chrome 42+
- Firefox 44+
- Safari 16+
- Edge 17+


# 푸시 알림 시스템 기술 문서

## 📋 목차

1. [시스템 아키텍처 개요](#시스템-아키텍처-개요)
2. [서비스워커 (Service Worker)](#서비스워커-service-worker)
3. [푸시 알림 Hook](#푸시-알림-hook)
4. [알림 UI 컴포넌트](#알림-ui-컴포넌트)
5. [API 클라이언트](#api-클라이언트)
6. [메인 애플리케이션](#메인-애플리케이션)
7. [HTTPS 설정 및 프록시](#https-설정-및-프록시)
8. [전체 서비스 흐름](#전체-서비스-흐름)
9. [보안 고려사항](#보안-고려사항)

---

## 시스템 아키텍처 개요

### 전체 구조
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Service Worker │    │   Backend API   │
│   (React App)   │◄──►│   (sw.js)       │◄──►│   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Push Hook      │    │  Push Events    │    │  Push Service   │
│  (usePush)      │    │  (FCM/WebPush)  │    │  (FCM Server)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 핵심 컴포넌트
- **Service Worker**: 백그라운드에서 푸시 이벤트 처리
- **Push Hook**: 푸시 알림 상태 관리 및 구독 처리
- **Notification UI**: 화면 내 알림 표시
- **API Client**: 백엔드와의 통신
- **HTTPS Proxy**: CORS 문제 해결

---

## 서비스워커 (Service Worker)

### 파일: `public/sw.js`

#### 1. 서비스워커 등록 및 설치

```javascript
// 서비스워커 설치 이벤트
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
        return self.skipWaiting(); // 즉시 활성화
      })
  );
});
```

**목적**: 
- 서비스워커 설치 시 필요한 리소스를 캐시에 저장
- `skipWaiting()`으로 즉시 새로운 서비스워커 활성화

**동작 원리**:
1. `install` 이벤트 발생 시 캐시 생성
2. 필요한 파일들을 캐시에 저장 (앱 리소스)
3. 설치 완료 후 즉시 활성화

#### 2. 서비스워커 활성화

```javascript
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName); // 오래된 캐시 삭제
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim(); // 모든 클라이언트 제어
    })
  );
});
```

**목적**:
- 오래된 캐시 정리
- 새로운 서비스워커가 모든 클라이언트를 제어하도록 설정

**동작 원리**:
1. 기존 캐시 목록 조회
2. 현재 버전이 아닌 캐시 삭제
3. `clients.claim()`으로 모든 탭 제어

#### 3. 푸시 이벤트 처리 (핵심)

```javascript
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  // 기본 알림 데이터 설정
  let notificationData = {
    title: '새로운 알림',
    body: '새로운 메시지가 도착했습니다.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    image: null,
    tag: 'default-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200], // 진동 패턴
    timestamp: Date.now(),
    url: '/',
    actions: [
      { action: 'view', title: '보기', icon: '/vite.svg' },
      { action: 'dismiss', title: '닫기' }
    ],
    data: {
      url: '/',
      timestamp: Date.now(),
      notificationId: null
    }
  };
```

**목적**:
- 푸시 서버에서 전송된 데이터를 파싱
- 알림 표시를 위한 옵션 구성

**동작 원리**:
1. 푸시 이벤트 수신
2. 기본 알림 데이터 설정
3. 전송된 데이터가 있으면 파싱하여 덮어쓰기

#### 4. 푸시 데이터 파싱

```javascript
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
```

**목적**:
- 서버에서 전송된 JSON 데이터를 파싱
- 알림 표시 옵션에 매핑

**동작 원리**:
1. `event.data.json()`으로 JSON 파싱 시도
2. 파싱된 데이터를 알림 옵션에 매핑
3. 실패 시 텍스트로 처리

#### 5. 알림 표시

```javascript
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
```

**목적**:
- 브라우저 알림 표시
- 메인 스레드에 알림 표시 완료 알림

**동작 원리**:
1. `showNotification()` API로 브라우저 알림 표시
2. 모든 열린 탭에 메시지 전송
3. 에러 처리

#### 6. 알림 클릭 이벤트 처리

```javascript
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
```

**목적**:
- 알림 클릭 시 앱 포커스 또는 새 탭 열기
- 메인 스레드에 클릭 이벤트 전송

**동작 원리**:
1. 알림 클릭 이벤트 수신
2. 알림 닫기
3. 메인 스레드에 클릭 데이터 전송
4. 기존 탭 포커스 또는 새 탭 열기

#### 7. 메시지 이벤트 처리

```javascript
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
```

**목적**:
- 메인 스레드와의 양방향 통신
- 테스트 알림, 알림 관리 기능 제공

**동작 원리**:
1. 메인 스레드에서 메시지 수신
2. 메시지 타입에 따른 처리
3. MessageChannel을 통한 응답 전송

---

## 푸시 알림 Hook

### 파일: `src/hooks/usePushNotification.ts`

#### 1. 상태 관리

```typescript
interface PushNotificationState {
  isSupported: boolean;        // 브라우저 지원 여부
  permission: NotificationPermission; // 알림 권한 상태
  isSubscribed: boolean;       // 푸시 구독 상태
  subscription: PushSubscription | null; // 푸시 구독 객체
  error: string | null;        // 에러 메시지
}

const [state, setState] = useState<PushNotificationState>({
  isSupported: false,
  permission: 'default',
  isSubscribed: false,
  subscription: null,
  error: null,
});
```

**목적**:
- 푸시 알림 관련 모든 상태를 중앙 집중 관리
- 타입 안전성 보장

**동작 원리**:
1. 초기 상태 설정
2. 각 액션에 따라 상태 업데이트
3. 컴포넌트에서 상태 구독

#### 2. 서비스워커 등록

```typescript
const registerServiceWorker = useCallback(async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setState(prev => ({ ...prev, error: '서비스워커 등록에 실패했습니다.' }));
      return null;
    }
  }
  return null;
}, []);
```

**목적**:
- 서비스워커 자동 등록
- 등록 실패 시 에러 처리

**동작 원리**:
1. 브라우저 지원 확인
2. `/sw.js` 파일 등록
3. 등록 결과 반환

#### 3. 브라우저 지원 확인

```typescript
const checkSupport = useCallback(() => {
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  setState(prev => ({ ...prev, isSupported }));
  return isSupported;
}, []);
```

**목적**:
- 푸시 알림 지원 여부 확인
- 지원하지 않는 브라우저에서 에러 방지

**동작 원리**:
1. `serviceWorker` API 존재 확인
2. `PushManager` API 존재 확인
3. 상태 업데이트

#### 4. 권한 요청

```typescript
const requestPermission = useCallback(async (): Promise<boolean> => {
  if (!state.isSupported) {
    setState(prev => ({ ...prev, error: '푸시 알림을 지원하지 않는 브라우저입니다.' }));
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    setState(prev => ({ ...prev, permission }));
    
    if (permission === 'granted') {
      return true;
    } else {
      setState(prev => ({ ...prev, error: '푸시 알림 권한이 거부되었습니다.' }));
      return false;
    }
  } catch (error) {
    console.error('Permission request failed:', error);
    setState(prev => ({ ...prev, error: '권한 요청에 실패했습니다.' }));
    return false;
  }
}, [state.isSupported]);
```

**목적**:
- 사용자에게 알림 권한 요청
- 권한 상태에 따른 처리

**동작 원리**:
1. 브라우저 지원 확인
2. `Notification.requestPermission()` 호출
3. 권한 결과에 따른 상태 업데이트

#### 5. 푸시 구독

```typescript
const subscribe = useCallback(async (): Promise<boolean> => {
  if (state.permission !== 'granted') {
    setState(prev => ({ ...prev, error: '푸시 알림 권한이 필요합니다.' }));
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI8p8KJguxQn4X4VXH9B8wP3ZWhN36yK10Mxhm0V8FId0U8nXjWQ9XNSHg'
    });

    setState(prev => ({ 
      ...prev, 
      isSubscribed: true, 
      subscription,
      error: null 
    }));

    return true;
  } catch (error) {
    console.error('Subscription failed:', error);
    setState(prev => ({ ...prev, error: '푸시 구독에 실패했습니다.' }));
    return false;
  }
}, [state.permission]);
```

**목적**:
- 푸시 알림 구독 생성
- VAPID 키를 사용한 보안 구독

**동작 원리**:
1. 권한 확인
2. 서비스워커 준비 대기
3. VAPID 키로 구독 생성
4. 구독 객체 저장

#### 6. 토큰 서버 전송

```typescript
const sendTokenToServer = useCallback(async (token: string): Promise<void> => {
  try {
    await axios.post('/api/push-token', {
      token,
      userId: 'user123', // 실제 사용자 ID로 교체
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      }
    });
    console.log('Token sent to server successfully');
  } catch (error) {
    console.error('Failed to send token to server:', error);
    setState(prev => ({ ...prev, error: '토큰 전송에 실패했습니다.' }));
  }
}, []);
```

**목적**:
- 구독 토큰을 서버에 전송
- 서버에서 푸시 알림 전송 가능하도록 설정

**동작 원리**:
1. 구독 토큰을 서버 API로 전송
2. 사용자 정보와 함께 저장
3. 에러 처리

#### 7. 초기화

```typescript
useEffect(() => {
  const initialize = async () => {
    // 지원 여부 확인
    checkSupport();
    
    if (state.isSupported) {
      // 서비스워커 등록
      await registerServiceWorker();
      
      // 현재 권한 상태 확인
      setState(prev => ({ ...prev, permission: Notification.permission }));
      
      // 기존 구독 확인
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          setState(prev => ({ 
            ...prev, 
            isSubscribed: true, 
            subscription 
          }));
        }
      } catch (error) {
        console.error('Failed to get existing subscription:', error);
      }
    }
  };

  initialize();
}, [checkSupport, registerServiceWorker, state.isSupported]);
```

**목적**:
- 컴포넌트 마운트 시 초기화
- 기존 구독 상태 복원

**동작 원리**:
1. 브라우저 지원 확인
2. 서비스워커 등록
3. 현재 권한 상태 확인
4. 기존 구독 상태 복원

---

## 알림 UI 컴포넌트

### 파일: `src/components/NotificationToast.tsx`

#### 1. 토스트 알림 컴포넌트

```typescript
interface NotificationToastProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
  show?: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  show = true,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);
```

**목적**:
- 화면 내 토스트 알림 표시
- 자동 사라짐 기능

**동작 원리**:
1. props로 알림 데이터 수신
2. 자동 타이머 설정
3. 애니메이션 상태 관리

#### 2. 알림 닫기 처리

```typescript
const handleClose = () => {
  setIsExiting(true);
  setTimeout(() => {
    setIsVisible(false);
    onClose?.();
  }, 300);
};
```

**목적**:
- 부드러운 닫기 애니메이션
- 콜백 함수 호출

**동작 원리**:
1. 닫기 애니메이션 시작
2. 300ms 후 완전히 제거
3. 부모 컴포넌트에 알림

#### 3. 아이콘 매핑

```typescript
const getIcon = () => {
  switch (type) {
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return 'ℹ️';
  }
};
```

**목적**:
- 알림 타입에 따른 아이콘 표시
- 시각적 구분

**동작 원리**:
1. 알림 타입 확인
2. 해당하는 이모지 반환

#### 4. 알림 컨테이너

```typescript
export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // 서비스워커에서 메시지 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
        const notification: Notification = {
          id: Date.now().toString(),
          title: event.data.title || '알림',
          message: event.data.message || '새로운 메시지가 있습니다.',
          type: event.data.notificationType || event.data.type || 'info',
          timestamp: Date.now(),
        };
        
        setNotifications(prev => [...prev, notification]);
      }
    };
```

**목적**:
- 여러 알림을 관리하는 컨테이너
- 서비스워커와의 통신

**동작 원리**:
1. 알림 배열 상태 관리
2. 메시지 이벤트 리스너 등록
3. 새 알림 추가

#### 5. 푸시 알림 설정 컴포넌트

```typescript
export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
  isSupported,
  permission,
  isSubscribed,
  onRequestPermission,
  onSubscribe,
  onUnsubscribe,
  error,
  onClearError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await onRequestPermission();
    } finally {
      setIsLoading(false);
    }
  };
```

**목적**:
- 푸시 알림 설정 UI 제공
- 사용자 상호작용 처리

**동작 원리**:
1. 로딩 상태 관리
2. 비동기 작업 처리
3. 에러 상태 표시

---

## API 클라이언트

### 파일: `src/api/pushApi.ts`

#### 1. Axios 인스턴스 생성

```typescript
const pushApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**목적**:
- 백엔드 API와의 통신 설정
- 기본 헤더 및 타임아웃 설정

**동작 원리**:
1. 환경 변수에서 API URL 가져오기
2. 기본 설정 적용
3. 재사용 가능한 인스턴스 생성

#### 2. 요청 인터셉터

```typescript
pushApi.interceptors.request.use(
  (config) => {
    // 토큰이 있다면 헤더에 추가
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);
```

**목적**:
- 모든 요청에 인증 토큰 자동 추가
- 요청 로깅

**동작 원리**:
1. 요청 전에 토큰 확인
2. Authorization 헤더 추가
3. 요청 로그 출력

#### 3. 응답 인터셉터

```typescript
pushApi.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.config?.url);
    
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

**목적**:
- 응답 로깅
- 인증 에러 처리

**동작 원리**:
1. 성공 응답 로깅
2. 에러 응답 처리
3. 401 에러 시 토큰 제거

#### 4. 푸시 구독 등록 API

```typescript
export const registerPushSubscription = async (data: PushSubscriptionData): Promise<PushTokenResponse> => {
  try {
    const response = await pushApi.post<PushTokenResponse>('/push-subscription', data);
    return response.data;
  } catch (error) {
    console.error('Failed to register push subscription:', error);
    throw new Error('푸시 구독 등록에 실패했습니다.');
  }
};
```

**목적**:
- 푸시 구독 정보를 서버에 등록
- 서버에서 푸시 알림 전송 가능하도록 설정

**동작 원리**:
1. 구독 데이터를 서버로 전송
2. 성공 시 응답 반환
3. 실패 시 에러 처리

#### 5. 테스트 푸시 알림 API

```typescript
export const sendTestPushNotification = async (userId: string, message: string): Promise<PushTokenResponse> => {
  try {
    const response = await pushApi.post<PushTokenResponse>('/push-test', {
      userId,
      message,
      title: '테스트 알림',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send test push notification:', error);
    throw new Error('테스트 푸시 알림 전송에 실패했습니다.');
  }
};
```

**목적**:
- 테스트용 푸시 알림 전송
- 개발 중 알림 기능 테스트

**동작 원리**:
1. 테스트 데이터를 서버로 전송
2. 서버에서 실제 푸시 알림 전송
3. 결과 반환

---

## 메인 애플리케이션

### 파일: `src/App.tsx`

#### 1. Hook 사용

```typescript
const {
  isSupported,
  permission,
  isSubscribed,
  subscription,
  error,
  requestPermission,
  subscribe,
  unsubscribe,
  clearError,
} = usePushNotification();
```

**목적**:
- 푸시 알림 Hook에서 상태와 함수 가져오기
- 컴포넌트에서 푸시 알림 기능 사용

**동작 원리**:
1. Hook에서 상태와 함수 반환
2. 컴포넌트에서 직접 사용

#### 2. 구독 성공 시 서버 전송

```typescript
useEffect(() => {
  if (subscription && isSubscribed) {
    const sendSubscriptionToServer = async () => {
      try {
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
          // userId: 'user123', // 실제 사용자 ID로 교체
          // deviceInfo: {
          //   userAgent: navigator.userAgent,
          //   platform: navigator.platform,
          //   language: navigator.language,
          //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          // },
        };

        await registerPushSubscription(subscriptionData);
        console.log('푸시 구독 정보가 서버에 등록되었습니다.');
      } catch (error) {
        console.error('서버에 구독 정보 전송 실패:', error);
      }
    };

    sendSubscriptionToServer();
  }
}, [subscription, isSubscribed]);
```

**목적**:
- 구독 성공 시 자동으로 서버에 전송
- 서버에서 푸시 알림 전송 가능하도록 설정

**동작 원리**:
1. 구독 상태 변경 감지
2. 구독 데이터를 Base64로 인코딩
3. 서버 API로 전송

#### 3. 서비스워커 메시지 처리

```typescript
useEffect(() => {
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, ...data } = event.data || {};
    
    switch (type) {
      case 'NOTIFICATION_CLICKED':
        console.log('서비스워커에서 알림 클릭 메시지 수신:', data);
        
        // UI에 알림 클릭 표시
        window.postMessage({
          type: 'NOTIFICATION_RECEIVED',
          title: `알림 클릭: ${data.title || '알림'}`,
          message: `알림이 클릭되었습니다. (액션: ${data.action || '기본'})`,
          notificationType: 'info',
        }, '*');
        break;
        
      case 'NOTIFICATION_DISPLAYED':
        console.log('서비스워커에서 알림 표시 완료 메시지 수신:', data);
        
        // UI에 알림 표시 완료 표시
        window.postMessage({
          type: 'NOTIFICATION_RECEIVED',
          title: '알림 표시됨',
          message: `"${data.title}" 알림이 표시되었습니다.`,
          notificationType: 'success',
        }, '*');
        break;
    }
  };

  window.addEventListener('message', handleServiceWorkerMessage);
  
  return () => {
    window.removeEventListener('message', handleServiceWorkerMessage);
  };
}, []);
```

**목적**:
- 서비스워커와의 통신 처리
- 알림 이벤트를 UI에 반영

**동작 원리**:
1. 서비스워커 메시지 수신
2. 메시지 타입에 따른 처리
3. UI에 알림 표시

#### 4. 서비스워커 통신 유틸리티

```typescript
const sendMessageToServiceWorker = (type: string, data?: any) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      console.log('서비스워커 응답:', event.data);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type, data },
      [messageChannel.port2]
    );
  } else {
    console.warn('서비스워커가 활성화되지 않았습니다.');
  }
};
```

**목적**:
- 메인 스레드에서 서비스워커로 메시지 전송
- 양방향 통신 지원

**동작 원리**:
1. MessageChannel 생성
2. 서비스워커 컨트롤러 확인
3. 메시지 전송

---

## HTTPS 설정 및 프록시

### 파일: `vite.config.ts`

#### 1. 인증서 로딩

```typescript
// HTTPS 인증서 경로 (mkcert 우선, 자체 서명 인증서 대체)
let httpsOptions = undefined;
let certificateType = 'none';

try {
  const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem');
  const certPath = path.resolve(__dirname, 'certs/localhost.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const certContent = fs.readFileSync(certPath, 'utf8');
    
    // mkcert 인증서인지 확인 (mkcert는 특정 주석을 포함)
    if (certContent.includes('mkcert') || certContent.includes('FiloSottile')) {
      certificateType = 'mkcert';
      console.log('🔐 mkcert 인증서를 찾았습니다. 정상적인 HTTPS 모드로 실행됩니다.');
      console.log('✅ 브라우저에서 "안전하지 않음" 경고가 나타나지 않습니다.');
    } else {
      certificateType = 'self-signed';
      console.log('🔐 자체 서명 인증서를 찾았습니다. HTTPS 모드로 실행됩니다.');
      console.log('⚠️  브라우저에서 "안전하지 않음" 경고가 나타날 수 있습니다.');
      console.log('💡 정상적인 인증서를 사용하려면: npm run setup:https:mkcert');
    }
    
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
} catch (error) {
  console.log('⚠️  HTTPS 인증서 로드 실패. HTTP 모드로 실행됩니다.');
}
```

**목적**:
- HTTPS 인증서 자동 로딩
- mkcert와 자체 서명 인증서 구분

**동작 원리**:
1. 인증서 파일 존재 확인
2. 인증서 내용 분석
3. 인증서 타입에 따른 메시지 출력

#### 2. 프록시 설정

```typescript
proxy: {
  // 백엔드 API 프록시 설정
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false, // HTTPS 백엔드가 아닌 경우
    rewrite: (path) => path.replace(/^\/api/, '/api'),
    configure: (proxy, options) => {
      proxy.on('error', (err, req, res) => {
        console.log('proxy error', err);
      });
      proxy.on('proxyReq', (proxyReq, req, res) => {
        console.log('Sending Request to the Target:', req.method, req.url);
      });
      proxy.on('proxyRes', (proxyRes, req, res) => {
        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
      });
    },
  },
}
```

**목적**:
- CORS 문제 해결
- 백엔드 API 프록시

**동작 원리**:
1. `/api` 요청을 백엔드로 프록시
2. 요청/응답 로깅
3. 에러 처리

---

## 전체 서비스 흐름

### 1. 초기화 흐름

```
1. 앱 시작
   ↓
2. usePushNotification Hook 초기화
   ↓
3. 브라우저 지원 확인
   ↓
4. 서비스워커 등록
   ↓
5. 기존 구독 상태 확인
   ↓
6. UI 렌더링
```

### 2. 푸시 알림 구독 흐름

```
1. 사용자가 "권한 요청" 클릭
   ↓
2. Notification.requestPermission() 호출
   ↓
3. 권한 허용 시 "푸시 알림 구독" 버튼 활성화
   ↓
4. 사용자가 "푸시 알림 구독" 클릭
   ↓
5. VAPID 키로 푸시 구독 생성
   ↓
6. 구독 정보를 서버에 전송
   ↓
7. 서버에서 푸시 알림 전송 가능
```

### 3. 푸시 알림 수신 흐름

```
1. 서버에서 푸시 알림 전송
   ↓
2. 브라우저가 푸시 이벤트를 서비스워커로 전달
   ↓
3. 서비스워커에서 푸시 데이터 파싱
   ↓
4. showNotification() API로 브라우저 알림 표시
   ↓
5. 메인 스레드에 알림 표시 완료 메시지 전송
   ↓
6. UI에 토스트 알림 표시
```

### 4. 알림 클릭 흐름

```
1. 사용자가 브라우저 알림 클릭
   ↓
2. 서비스워커에서 notificationclick 이벤트 수신
   ↓
3. 알림 닫기
   ↓
4. 메인 스레드에 클릭 이벤트 전송
   ↓
5. 기존 탭 포커스 또는 새 탭 열기
   ↓
6. UI에 클릭 알림 표시
```

---

## 보안 고려사항

### 1. VAPID 키 관리
- **공개 키**: 클라이언트에서 사용 (노출 가능)
- **개인 키**: 서버에서만 사용 (절대 노출 금지)
- **환경 변수**: 프로덕션에서는 안전한 키 사용

### 2. HTTPS 필수
- **푸시 알림**: HTTPS 환경에서만 작동
- **서비스워커**: HTTPS 또는 localhost에서만 등록 가능
- **mkcert**: 정상적인 인증서로 보안 경고 방지

### 3. 권한 관리
- **사용자 동의**: 명시적 권한 요청 후에만 사용
- **권한 상태**: 지속적으로 모니터링
- **구독 관리**: 사용자가 언제든 구독 해제 가능

### 4. 데이터 보호
- **구독 정보**: 암호화되어 전송
- **개인정보**: 최소한의 정보만 수집
- **토큰 관리**: 안전한 저장 및 전송

---

## 성능 최적화

### 1. 서비스워커 최적화
- **캐시 전략**: 필요한 리소스만 캐시
- **이벤트 처리**: 비동기 처리로 블로킹 방지
- **메모리 관리**: 불필요한 리소스 정리

### 2. 네트워크 최적화
- **프록시 사용**: CORS 문제 해결
- **요청 최적화**: 불필요한 요청 방지
- **에러 처리**: 네트워크 에러에 대한 적절한 처리

### 3. UI 최적화
- **토스트 알림**: 자동 사라짐으로 UX 향상
- **로딩 상태**: 사용자 피드백 제공
- **에러 처리**: 명확한 에러 메시지

---

## 디버깅 가이드

### 1. 서비스워커 디버깅
- **Chrome DevTools**: Application > Service Workers
- **콘솔 로그**: 서비스워커 로그 확인
- **네트워크 탭**: 푸시 요청 확인

### 2. 푸시 알림 디버깅
- **권한 상태**: Notification.permission 확인
- **구독 상태**: PushManager.getSubscription() 확인
- **VAPID 키**: 올바른 키 사용 확인

### 3. 네트워크 디버깅
- **프록시 로그**: Vite 프록시 로그 확인
- **API 응답**: 백엔드 API 응답 확인
- **CORS 에러**: 브라우저 콘솔에서 CORS 에러 확인

---

이 문서는 푸시 알림 시스템의 모든 구성 요소와 동작 원리를 상세히 설명합니다. 각 코드의 목적과 동작 원리를 이해하면 시스템을 더 효과적으로 유지보수하고 확장할 수 있습니다.
