import { useEffect, useState } from 'react';
import './App.css';
import { usePushNotification } from './hooks/usePushNotification';
import {
  NotificationContainer,
} from './components/NotificationToast';
import { registerPushSubscription } from './api/pushApi';

import WebSocketTest from './components/WebSocketTest';

/**
 * @function App
 * @description 메인 애플리케이션 컴포넌트.
 * 푸시 알림 및 웹소켓 데모 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 사용자 ID 생성 및 관리
 * 2. usePushNotification 훅을 사용하여 푸시 알림 관련 상태 및 함수 관리
 * 3. 푸시 구독 성공 시 서버에 구독 정보 전송
 * 4. 서비스 워커로부터 브로드캐스트 채널을 통해 메시지 수신 및 처리
 * 5. 푸시 알림 상태 (브라우저 지원, 권한, 구독 여부) 표시
 * 6. 푸시 알림 구독/해지 버튼 렌더링
 * 7. WebSocketTest 컴포넌트를 통한 웹소켓 통신 데모
 * 8. NotificationContainer를 통한 토스트 알림 표시
 */
function App() {
  // 고유한 사용자 ID를 생성합니다. 페이지 로드 시 한 번만 생성됩니다.
  // 이 ID는 푸시 구독 정보를 서버에 전송할 때 사용됩니다.
  const [userId] = useState(() => `user_${Date.now()}`);

  // usePushNotification 커스텀 훅을 사용하여 푸시 알림 관련 로직을 관리합니다.
  // 이 훅은 푸시 알림의 지원 여부, 권한 상태, 구독 여부, 구독 객체,
  // 그리고 권한 요청, 구독, 해지 함수를 제공합니다.
  const {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotification();

  /**
   * @useEffect
   * @description 푸시 구독 정보가 변경되거나 구독 상태가 활성화될 때 서버에 구독 정보를 전송합니다.
   *
   * - `subscription` 객체가 존재하고 `isSubscribed`가 true일 때 실행됩니다.
   * - 구독 객체에서 `endpoint`, `p256dh` 키, `auth` 키를 추출하여 서버에 전송할 형식으로 변환합니다.
   * - `registerPushSubscription` API를 호출하여 서버에 구독 정보를 등록합니다.
   * - 오류 발생 시 콘솔에 에러를 로깅합니다.
   */
  useEffect(() => {
    if (subscription && isSubscribed) {
      const sendSubscriptionToServer = async () => {
        try {
          // Web Push 표준에 맞는 구독 정보를 구성합니다.
          // p256dh 및 auth 키는 Uint8Array 형태이므로 Base64 문자열로 변환합니다.
          const subscriptionData = {
            endpoint: subscription.endpoint,
            userId: userId, // 현재 사용자 ID를 함께 전송합니다.
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
            },
          };

          // 서버 API를 호출하여 구독 정보를 등록합니다.
          await registerPushSubscription(subscriptionData);
          console.log('푸시 구독 정보가 서버에 등록되었습니다.');
        } catch (error) {
          console.error('서버에 구독 정보 전송 실패:', error);
        }
      };

      sendSubscriptionToServer();
    }
  }, [subscription, isSubscribed, userId]); // userId를 의존성 배열에 추가하여 변경 시 재실행되도록 합니다.

  /**
   * @useEffect
   * @description 서비스 워커로부터 브로드캐스트 채널을 통해 메시지를 수신하고 처리합니다.
   *
   * - `BroadcastChannel`을 생성하여 서비스 워커와 메인 스레드 간의 통신 채널을 설정합니다.
   * - 서비스 워커에서 전송된 `NOTIFICATION_CLICKED` 또는 `NOTIFICATION_DISPLAYED` 메시지를 수신합니다.
   * - 수신된 메시지 타입에 따라 `window` 객체에 커스텀 이벤트를 디스패치합니다.
   *   - `notification-clicked`: 사용자가 알림을 클릭했을 때 발생합니다.
   *   - `notification-displayed`: 알림이 성공적으로 표시되었을 때 발생합니다.
   * - 컴포넌트 언마운트 시 이벤트 리스너를 제거하고 브로드캐스트 채널을 닫습니다.
   */
  useEffect(() => {
    // 'notification-channel'이라는 이름의 브로드캐스트 채널을 생성합니다.
    // 이 채널을 통해 서비스 워커와 메인 스레드가 통신합니다.
    const bc = new BroadcastChannel('notification-channel');

    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('[App.tsx] Message received from broadcast channel:', event.data);
      // 서비스 워커로부터 알림 클릭 이벤트가 발생했음을 알리는 메시지를 수신합니다.
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        console.log('[App.tsx] NOTIFICATION_CLICKED message received.');
        // `notification-clicked`라는 커스텀 이벤트를 생성하여 window 객체에 디스패치합니다.
        // 이 이벤트를 통해 다른 컴포넌트(예: NotificationToast)에서 알림 클릭을 감지하고 처리할 수 있습니다.
        const customEvent = new CustomEvent('notification-clicked', {
          detail: event.data, // 서비스 워커로부터 받은 알림 데이터를 이벤트 상세 정보로 전달합니다.
        });
        console.log('[App.tsx] Dispatching notification-clicked event:', customEvent);
        window.dispatchEvent(customEvent);
      }
      // 서비스 워커로부터 알림이 성공적으로 표시되었음을 알리는 메시지를 수신합니다.
      if (event.data && event.data.type === 'NOTIFICATION_DISPLAYED') {
        // `notification-displayed`라는 커스텀 이벤트를 생성하여 window 객체에 디스패치합니다.
        const customEvent = new CustomEvent('notification-displayed', {
          detail: event.data, // 서비스 워커로부터 받은 알림 데이터를 이벤트 상세 정보로 전달합니다.
        });
        window.dispatchEvent(customEvent);
      }
      // 서비스 워커로부터 알림 표시 중 에러가 발생했음을 알리는 메시지를 수신합니다.
      if (event.data && event.data.type === 'NOTIFICATION_ERROR') {
        console.error('[App.tsx] NOTIFICATION_ERROR message received:', event.data.error);
        // 에러 처리 로직을 추가할 수 있습니다. (예: 사용자에게 알림)
      }
    };

    // 브로드캐스트 채널에 메시지 리스너를 등록합니다.
    bc.addEventListener('message', handleBroadcastMessage);

    // 컴포넌트 언마운트 시 이벤트 리스너를 제거하고 채널을 닫아 메모리 누수를 방지합니다.
    return () => {
      bc.removeEventListener('message', handleBroadcastMessage);
      bc.close();
    };
  }, []); // 빈 의존성 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미합니다.


  return (
    <div className="app">
      <header className="app-header">
        <h1>WS - WebPush - Demo</h1>
        <p>서비스워커를 통한 백그라운드 푸시 알림 기능</p>
        <p>웹소켓을 통한 양방향 실시간 통신 기능</p>
      </header>

      <main className="app-main">
        {/* 푸시 알림 상태 및 구독/해지 버튼 섹션 */}
        <div className="demo-section">
          <div className="status-between">
            <h2>푸시 알림 상태</h2>
            {/* 구독 버튼 컴포넌트 */}
            <SubscribeButton
              permission={permission}
              isSubscribed={isSubscribed}
              requestPermission={requestPermission}
              subscribe={subscribe}
              unsubscribe={unsubscribe}
            />
          </div>
          <div className="status-grid">
            {/* 브라우저 지원 상태 표시 */}
            <div className="status-item">
              <span className="status-label">브라우저 지원:</span>
              <span className={`status-value ${isSupported ? 'supported' : 'not-supported'}`}>
                {isSupported ? '지원됨' : '지원 안됨'}
              </span>
            </div>
            {/* 알림 권한 상태 표시 */}
            <div className="status-item">
              <span className="status-label">권한 상태:</span>
              <span className={`status-value ${permission}`}>
                {permission === 'granted' ? '허용됨' : 
                 permission === 'denied' ? '거부됨' : '요청 필요'}
              </span>
            </div>
            {/* 푸시 구독 상태 표시 */}
            <div className="status-item">
              <span className="status-label">구독 상태:</span>
              <span className={`status-value ${isSubscribed ? 'subscribed' : 'not-subscribed'}`}>
                {isSubscribed ? '구독됨' : '구독 안됨'}
              </span>
            </div>
          </div>
        </div>

        {/* 웹소켓 테스트 섹션 */}
        <div className="demo-section">
          {/* WebSocketTest 컴포넌트에 현재 사용자 ID를 전달합니다. */}
          <WebSocketTest userId={userId} />
        </div>
      </main>

      {/* 토스트 알림을 표시하는 컨테이너 컴포넌트 */}
      <NotificationContainer />
    </div>
  );
}

/**
 * @interface SubscribeButtonProps
 * @description SubscribeButton 컴포넌트의 props 타입을 정의합니다.
 */
interface SubscribeButtonProps {
  permission: NotificationPermission; // 알림 권한 상태 ('granted', 'denied', 'default')
  isSubscribed: boolean; // 푸시 알림 구독 여부
  requestPermission: () => Promise<boolean>; // 알림 권한 요청 함수
  subscribe: () => Promise<boolean>; // 푸시 알림 구독 함수
  unsubscribe: () => Promise<boolean>; // 푸시 알림 구독 해지 함수
}

/**
 * @function SubscribeButton
 * @description 푸시 알림 권한 요청, 구독, 해지 버튼을 렌더링하는 컴포넌트.
 *
 * - `permission` 상태에 따라 '권한 요청', '푸시 알림 구독', '구독 해제' 버튼을 조건부 렌더링합니다.
 * - 각 버튼 클릭 시 `usePushNotification` 훅에서 전달받은 해당 함수를 호출합니다.
 * - 로딩 상태를 관리하여 버튼 중복 클릭을 방지하고 사용자에게 피드백을 제공합니다.
 */
function SubscribeButton({
  permission,
  isSubscribed,
  requestPermission,
  subscribe,
  unsubscribe
}: SubscribeButtonProps) {  
  // 버튼의 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);

  /**
   * @async
   * @function handleRequestPermission
   * @description 알림 권한 요청 버튼 클릭 핸들러.
   * `requestPermission` 함수를 호출하여 사용자에게 알림 권한을 요청합니다.
   * 로딩 상태를 토글하여 중복 요청을 방지합니다.
   */
  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @async
   * @function handleSubscribe
   * @description 푸시 알림 구독 버튼 클릭 핸들러.
   * `subscribe` 함수를 호출하여 푸시 알림을 구독합니다.
   * 구독 성공 시 콘솔에 메시지를 로깅합니다.
   * 로딩 상태를 토글하여 중복 요청을 방지합니다.
   */
  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await subscribe();
      if (success) {
        // 구독 성공 시 서버에 토큰을 전송하는 로직은 usePushNotification 훅 내부 또는 App 컴포넌트의 useEffect에서 처리됩니다.
        console.log('푸시 알림 구독이 완료되었습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @async
   * @function handleUnsubscribe
   * @description 푸시 알림 구독 해지 버튼 클릭 핸들러.
   * `unsubscribe` 함수를 호출하여 푸시 알림 구독을 해지합니다.
   * 로딩 상태를 토글하여 중복 요청을 방지합니다.
   */
  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="action-buttons">
        {/* 알림 권한이 'granted'가 아닐 때만 권한 요청 버튼을 표시합니다. */}
        {permission !== 'granted' && (
          <button 
            onClick={handleRequestPermission}
            disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
            className="btn btn-primary"
          >
            {isLoading ? '요청 중...' : '권한 요청'}
          </button>
        )}

        {/* 알림 권한이 'granted'이고 아직 구독되지 않았을 때만 푸시 알림 구독 버튼을 표시합니다. */}
        {permission === 'granted' && !isSubscribed && (
          <button 
            onClick={handleSubscribe}
            disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
            className="btn btn-success"
          >
            {isLoading ? '구독 중...' : '푸시 알림 구독'}
          </button>
        )}

        {/* 푸시 알림이 구독된 상태일 때만 구독 해제 버튼을 표시합니다. */}
        {isSubscribed && (
          <button 
            onClick={handleUnsubscribe}
            disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
            className="btn btn-danger"
          >
            {isLoading ? '해제 중...' : '구독 해제'}
          </button>
        )}
      </div>
    </>
  );
}

export default App;