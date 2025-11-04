🚀 웹 푸시 알림 데모 (프론트엔드)

이 프로젝트는 React, TypeScript, Vite로 구축된 프론트엔드 애플리케이션으로, 웹 푸시 알림 및 WebSocket 통신 기능을
시연합니다.

✨ 주요 기능

- 서비스 워커 기반 푸시 알림: 백그라운드에서 푸시 이벤트를 처리합니다.
- 실시간 알림 UI: 다양한 이벤트에 대한 토스트 알림을 표시합니다.
- 포괄적인 푸시 알림 시스템: 권한 요청, 구독 및 토큰 전송을 관리합니다.
- WebSocket 통신: 크롤링 진행 상황을 위한 백엔드와의 실시간 데이터 교환.
- HTTPS 로컬 개발 환경: 보안 개발을 위한 자동 SSL 인증서 생성.
- Vite 프록시 설정: 백엔드 API 통신을 위한 CORS 문제 해결.

🛠️ 기술 스택

- 프론트엔드: React 19, TypeScript, Vite
- 스타일링: CSS3
- HTTP 클라이언트: Axios
- 푸시 알림: Service Worker, Push API, Notification API
- 실시간 통신: WebSockets
- 개발 도구: HTTPS, Proxy, Hot Reload

📦 설치 및 실행

이 프로젝트를 실행하려면 Node.js (v18 이상) 및 npm이 설치되어 있어야 합니다.

1. 의존성 설치

프론트엔드 프로젝트 디렉토리로 이동하여 필요한 패키지를 설치합니다:

1 cd web-push-with-redis-kafka-fe
2 npm install

2. HTTPS 인증서 생성 (푸시 알림에 필수)

웹 푸시 알림 및 서비스 워커는 보안 컨텍스트(HTTPS)를 필요로 합니다.

🎯 권장: mkcert (신뢰할 수 있는 인증서)

mkcert는 브라우저 경고를 피하면서 로컬에서 신뢰할 수 있는 개발 인증서를 생성합니다.

1 # mkcert 설치 (아직 설치되지 않은 경우)
2 # Windows: choco install mkcert (Chocolatey 사용) 또는 GitHub에서 수동 다운로드
3 # macOS: brew install mkcert
4 # Linux: sudo apt install libnss3-tools (그 후 GitHub에서 수동 설치)
5
6 # 인증서 생성
7 npm run setup:https:mkcert

mkcert 재설치 및 신뢰 루트 인증서 재등록

mkcert -uninstall로 기존 루트 인증서 제거

mkcert -install로 로컬 신뢰 루트 인증서 재설치

mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1

3. 환경 변수

프로젝트 루트 (web-push-with-redis-kafka-fe/.env)에 .env 파일을 생성하고 다음 내용을 추가합니다:

1 # API 설정
2 VITE_API_URL=/api # 백엔드 API 기본 URL
3 VITE_WS_URL=ws://localhost:8080/ws # 백엔드 WebSocket 기본 URL
4
5 # VAPID 공개 키 (백엔드 설정에서 가져옴)
6 VITE_APP_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY_HERE

공개키 생성성
npx web-push generate-vapid-keys

참고: YOUR_VAPID_PUBLIC_KEY_HERE를 백엔드 애플리케이션에서 생성된 실제 VAPID 공개 키로 대체하십시오.

4. 개발 서버 실행
1 npm run dev

5. 브라우저에서 접속

브라우저를 열고 https://localhost:5173으로 이동합니다.
자체 서명 인증서를 사용하는 경우, 브라우저 경고를 우회하기 위해 "고급" -> "localhost로 진행 (안전하지 않음)"을
클릭해야 할 수 있습니다.

🎯 사용법

1.  권한 요청: "권한 요청" 버튼을 클릭하여 알림 권한을 허용합니다.
2.  푸시 구독: "푸시 알림 구독" 버튼을 클릭하여 브라우저를 푸시 알림에 등록합니다.
3.  테스트 푸시 알림: 입력 필드와 "테스트 푸시 알림 보내기" 버튼을 사용하여 백엔드를 통해 테스트 알림을 보냅니다.
4.  크롤링 시작: "크롤링 시작" 버튼을 클릭하여 백엔드에서 크롤링 프로세스를 시작하고 WebSocket을 통해 실시간 업데이트를
    관찰합니다.

---

📚 아키텍처 및 코드 설명

이 섹션에서는 애플리케이션의 아키텍처, 주요 파일 및 기능에 대한 개요를 제공합니다.

1. 전체 아키텍처

   1 ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   2 │ 프론트엔드 │ │ 서비스 워커 │ │ 백엔드 API │
   3 │ (React 앱) │◄──►│ (public/sw.js)│◄──►│ (Spring Boot) │
   4 └─────────────────┘ └─────────────────┘ └─────────────────┘
   5 │ │ │
   6 │ │ │
   7 ▼ ▼ ▼
   8 ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   9 │ 푸시 훅 │ │ 푸시 이벤트 │ │ 푸시 서비스 │

10 │ (usePush) │ │ (WebPush) │ │ (VAPID/FCM) │
11 └─────────────────┘ └─────────────────┘ └─────────────────┘

프론트엔드(React 앱)는 푸시 알림을 위해 서비스 워커와 상호 작용하고, 다른 기능(예: 구독 등록, 크롤링 트리거)을 위해
백엔드 API와 직접 상호 작용합니다. 서비스 워커는 백그라운드에서 푸시 이벤트를 처리하고 BroadcastChannel을 통해 메인
애플리케이션 스레드와 통신합니다.

2. 주요 파일 및 패키지

src/App.tsx

- 역할: 메인 애플리케이션 컴포넌트입니다. usePushNotification을 사용하여 푸시 알림 로직을 조정하고 WebSocketTest를 통해
  WebSocket 통신을 통합합니다. 또한 서비스 워커로부터의 통신을 처리하여 토스트 알림을 표시합니다.
- 주요 로직:
  - 고유한 userId를 초기화합니다.
  - usePushNotification 훅을 사용하여 푸시 알림 상태 및 작업을 관리합니다.
  - 구독이 설정되면 푸시 구독 데이터를 백엔드로 전송하는 useEffect를 사용합니다.
  - BroadcastChannel을 통해 서비스 워커로부터 메시지(예: NOTIFICATION_CLICKED, NOTIFICATION_DISPLAYED)를 수신하고
    사용자 정의 window 이벤트를 디스패치하는 useEffect를 사용합니다.
  - 푸시 구독 관리를 위한 SubscribeButton, WebSocket 데모를 위한 WebSocketTest, 토스트 알림을 위한
    NotificationContainer를 렌더링합니다.

src/main.tsx

- 역할: React 애플리케이션의 진입점입니다.
- 주요 로직: react-dom/client의 createRoot를 사용하여 App 컴포넌트를 HTML root 요소에 렌더링합니다.

src/api/

- 역할: 백엔드와 상호 작용하기 위한 API 클라이언트 모듈을 포함합니다.
  - crawlingApi.ts: 백엔드에서 웹 크롤링을 트리거하는 기능을 제공합니다.
  - pushApi.ts: 푸시 구독을 등록하고 백엔드로 테스트 푸시 알림을 보내는 기능을 제공합니다.
- 주요 로직:
  - HTTP 요청에 axios를 사용합니다.
  - pushApi.ts는 환경 변수에서 baseURL을 가져와 axios 인스턴스를 구성하고 Content-Type 헤더를 설정합니다.
  - PushSubscriptionData 및 PushTokenResponse에 대한 인터페이스를 정의합니다.

src/components/

- 역할: 재사용 가능한 UI 컴포넌트입니다.
  - NotificationToast.tsx:
    - NotificationToast: 제목, 메시지, 유형(정보, 성공, 경고, 오류) 및 자동 해제 기간이 있는 단일 해제 가능한
      토스트 알림을 표시합니다.
    - NotificationContainer: NotificationToast 컴포넌트 목록을 관리합니다. App.tsx에서 디스패치된 사용자 정의
      window 이벤트(notification-clicked, notification-displayed)를 수신하고(이는 서비스 워커로부터 수신됨) 새
      토스트 알림을 UI에 추가합니다.
  - WebSocketTest.tsx: 실시간 WebSocket 통신을 시연합니다.
    - 백엔드 WebSocket 엔드포인트(/ws/test/{userId})에 연결합니다.
    - WebSocket을 통해 수신된 실시간 크롤링 진행 상황 및 데이터를 표시합니다.
    - 크롤링을 시작하고 테스트 푸시 알림을 보내는 버튼을 제공합니다.

src/hooks/usePushNotification.ts

- 역할: 웹 푸시 알림을 위한 모든 클라이언트 측 로직을 캡슐화하는 사용자 정의 React 훅입니다.
- 주요 로직:
  - isSupported, permission, isSubscribed, subscription, error 상태를 관리합니다.
  - registerServiceWorker(): public/sw.js 서비스 워커를 등록합니다.
  - checkSupport(): 브라우저가 웹 푸시를 지원하는지 확인합니다.
  - requestPermission(): 사용자에게 알림 권한을 요청합니다.
  - subscribe(): VAPID 공개 키를 사용하여 브라우저를 푸시 서비스에 구독합니다.
  - unsubscribe(): 푸시 서비스에서 구독을 해제합니다.
  - 초기화를 위한 useEffect: 지원 여부를 확인하고, 서비스 워커를 등록하고, 현재 권한을 확인하고, 기존 푸시 구독을
    검색합니다.

public/sw.js (서비스 워커)

- 역할: 메인 애플리케이션 스레드와 별도로 백그라운드에서 실행됩니다. 애플리케이션이 닫혀 있을 때도 푸시 이벤트를
  처리하는 데 중요합니다.
- 주요 로직:
  - self.addEventListener('push', ...):
    - 푸시 서비스(예: FCM)로부터 푸시 메시지를 수신합니다.
    - 들어오는 event.data를 파싱합니다(JSON 및 일반 텍스트 모두 처리).
    - 알림 옵션(제목, 본문, 아이콘, 배지, 태그 등)을 구성합니다.
    - self.registration.showNotification()을 사용하여 시스템 알림을 표시합니다.
    - BroadcastChannel을 통해 메인 애플리케이션 스레드와 통신합니다(NOTIFICATION_DISPLAYED, NOTIFICATION_ERROR).
  - self.addEventListener('notificationclick', ...):
    - 시스템 알림에 대한 사용자 클릭을 처리합니다.
    - 알림을 닫습니다.
    - BroadcastChannel을 통해 메인 애플리케이션 스레드와 통신합니다(NOTIFICATION_CLICKED).
    - 알림 데이터에 지정된 URL로 기존 탭에 포커스를 맞추거나 새 탭을 엽니다.

3. 사용된 기술

- React 19: 사용자 인터페이스 구축을 위한 JavaScript 라이브러리.
- TypeScript: 일반 JavaScript로 컴파일되는 JavaScript의 타입이 지정된 상위 집합. 코드 품질 및 유지 관리성을
  향상시킵니다.
- Vite: 최신 웹 프로젝트를 위한 번개처럼 빠른 개발 경험을 제공하는 빠른 빌드 도구.
- Axios: 브라우저 및 Node.js를 위한 Promise 기반 HTTP 클라이언트.
- Service Worker: 웹 페이지와 별도로 백그라운드에서 브라우저가 실행하는 스크립트로, 푸시 알림과 같이 웹 페이지나 사용자
  상호 작용이 필요 없는 기능의 문을 엽니다.
- Push API: 웹 애플리케이션이 웹 앱이 활성화되어 있지 않아도 서버에서 웹 브라우저로 푸시되는 메시지를 수신할 수 있도록
  합니다.
- Notification API: 웹 페이지가 사용자에게 시스템 알림 표시를 제어할 수 있도록 합니다.
- WebSockets: 단일 TCP 연결을 통해 전이중 통신 채널을 제공하여 실시간 대화형 통신을 가능하게 하는 통신 프로토콜.
- VAPID (Voluntary Application Server Identification): 푸시 서비스에 애플리케이션 서버를 식별하기 위한 표준. 공개 및
  개인 키 쌍을 사용합니다.
- `mkcert`: 로컬에서 신뢰할 수 있는 개발 인증서를 만드는 간단한 도구.
- `BroadcastChannel` API: 브라우징 컨텍스트(예: 페이지와 서비스 워커, 또는 동일한 출처의 여러 탭/창) 간의 기본 통신을
  허용합니다.
