import { useEffect, useState } from 'react';
import './App.css';
import { usePushNotification } from './hooks/usePushNotification';
import { 
  NotificationContainer, 
} from './components/NotificationToast';
import { registerPushSubscription, sendPushNotification } from './api/pushApi';

function App() {
  const [message, setMessage] = useState('');
  const {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotification();

  // 구독 성공 시 서버에 토큰 전송
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

  // 서비스워커 메시지 수신
  useEffect(() => {
    const bc = new BroadcastChannel('notification-channel');

    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('[App.tsx] Message received from broadcast channel:', event.data);
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        console.log('[App.tsx] NOTIFICATION_CLICKED message received.');
        // 사용자 정의 이벤트를 생성하여 알림 데이터를 전달합니다.
        const customEvent = new CustomEvent('notification-clicked', {
          detail: event.data,
        });
        console.log('[App.tsx] Dispatching notification-clicked event:', customEvent);
        window.dispatchEvent(customEvent);
      }
      if (event.data && event.data.type === 'NOTIFICATION_DISPLAYED') {
        const customEvent = new CustomEvent('notification-displayed', {
          detail: event.data,
        });
        window.dispatchEvent(customEvent);
      }
    };

    bc.addEventListener('message', handleBroadcastMessage);

    return () => {
      bc.removeEventListener('message', handleBroadcastMessage);
      bc.close();
    };
  }, []);



  return (
    <div className="app">
      <header className="app-header">
        <h1>푸시 알림 데모 앱</h1>
        <p>서비스워커와 푸시 알림 기능을 테스트해보세요.</p>
      </header>

      <main className="app-main">
        <div className="demo-section">
          <div className="status-between">
            <h2>푸시 알림 상태</h2>
            <SubscribeButton
              permission={permission}
              isSubscribed={isSubscribed}
              requestPermission={requestPermission}
              subscribe={subscribe}
              unsubscribe={unsubscribe}
            />
          </div>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">브라우저 지원:</span>
              <span className={`status-value ${isSupported ? 'supported' : 'not-supported'}`}>
                {isSupported ? '지원됨' : '지원 안됨'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">권한 상태:</span>
              <span className={`status-value ${permission}`}>
                {permission === 'granted' ? '허용됨' : 
                 permission === 'denied' ? '거부됨' : '요청 필요'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">구독 상태:</span>
              <span className={`status-value ${isSubscribed ? 'subscribed' : 'not-subscribed'}`}>
                {isSubscribed ? '구독됨' : '구독 안됨'}
              </span>
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h2>테스트 기능</h2>
          <div className="test-buttons">
            <input 
            type='text' 
            value={message}
            onChange={(e) => setMessage(e.target.value)} />
            <button 
              className="test-btn"
              onClick={() => {
                sendPushNotification(message);
              }}
              disabled={permission !== 'granted'}
            >
              알림 전송
            </button>
          </div>
        </div>
      </main>

      <NotificationContainer />
    </div>
  );
}

interface SubscribeButtonProps {
  permission: NotificationPermission
  isSubscribed: boolean
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

function SubscribeButton({
  permission,
  isSubscribed,
  requestPermission,
  subscribe,
  unsubscribe
}: SubscribeButtonProps) {  
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await subscribe();
      if (success) {
        // 구독 성공 시 토큰을 서버로 전송하는 로직은 Hook에서 처리
        console.log('푸시 알림 구독이 완료되었습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        {permission !== 'granted' && (
          <button 
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? '요청 중...' : '권한 요청'}
          </button>
        )}

        {permission === 'granted' && !isSubscribed && (
          <button 
            onClick={handleSubscribe}
            disabled={isLoading}
            className="btn btn-success"
          >
            {isLoading ? '구독 중...' : '푸시 알림 구독'}
          </button>
        )}

        {isSubscribed && (
          <button 
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? '해제 중...' : '구독 해제'}
          </button>
        )}
      </div>
    </>
  )
}

export default App;
