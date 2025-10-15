import { useEffect } from 'react';
import './App.css';
import { usePushNotification } from './hooks/usePushNotification';
import { 
  NotificationContainer, 
  PushNotificationSettings 
} from './components/NotificationToast';
import { registerPushSubscription } from './api/pushApi';

function App() {
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

  // 브라우저 알림 클릭 이벤트 처리
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      console.log('브라우저 알림이 클릭되었습니다:', event);
      
      // 메인 스레드에 알림 클릭 메시지 전송
      window.postMessage({
        type: 'NOTIFICATION_RECEIVED',
        title: '알림 클릭',
        message: '브라우저 알림을 클릭했습니다.',
        notificationType: 'info',
      }, '*');
    };

    // 서비스워커 메시지 수신
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
          
        case 'NOTIFICATION_PERMISSION_STATUS':
          console.log('알림 권한 상태:', data.permission);
          break;
          
        case 'TEST_NOTIFICATION_SENT':
          console.log('테스트 알림 전송 결과:', data);
          break;
          
        case 'NOTIFICATIONS_CLEARED':
          console.log('알림 클리어 완료:', data.count, '개');
          break;
          
        case 'NOTIFICATION_COUNT':
          console.log('현재 알림 개수:', data.count);
          break;
          
        default:
          console.log('알 수 없는 서비스워커 메시지:', type, data);
      }
    };

    window.addEventListener('notificationclick', handleNotificationClick);
    window.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      window.removeEventListener('notificationclick', handleNotificationClick);
      window.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // 서비스워커와 통신하는 유틸리티 함수들
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

  const sendTestNotification = () => {
    sendMessageToServiceWorker('SEND_TEST_NOTIFICATION', {
      title: '서비스워커 테스트 알림',
      body: '서비스워커에서 직접 전송한 테스트 알림입니다.',
      icon: '/vite.svg',
      url: '/'
    });
  };

  const clearAllNotifications = () => {
    sendMessageToServiceWorker('CLEAR_ALL_NOTIFICATIONS');
  };

  const getNotificationCount = () => {
    sendMessageToServiceWorker('GET_NOTIFICATION_COUNT');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>푸시 알림 데모 앱</h1>
        <p>서비스워커와 푸시 알림 기능을 테스트해보세요.</p>
      </header>

      <main className="app-main">
        <div className="demo-section">
          <h2>푸시 알림 상태</h2>
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

        <PushNotificationSettings
          isSupported={isSupported}
          permission={permission}
          isSubscribed={isSubscribed}
          onRequestPermission={requestPermission}
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
          error={error}
          onClearError={clearError}
        />

        <div className="demo-section">
          <h2>테스트 기능</h2>
          <div className="test-buttons">
            <button 
              className="test-btn"
              onClick={() => {
                window.postMessage({
                  type: 'NOTIFICATION_RECEIVED',
                  title: 'UI 알림 테스트',
                  message: '이것은 화면 내 알림 테스트입니다.',
                  notificationType: 'info',
                }, '*');
              }}
            >
              UI 알림 테스트
            </button>
            
            <button 
              className="test-btn"
              onClick={() => {
                if (permission === 'granted') {
                  const notificationOptions: any = {
                    body: '이것은 브라우저 알림입니다.',
                    icon: '/vite.svg',
                    tag: 'test-notification',
                    requireInteraction: true,
                    actions: [
                      { action: 'view', title: '보기' },
                      { action: 'dismiss', title: '닫기' }
                    ]
                  };
                  new Notification('브라우저 알림 테스트', notificationOptions);
                } else {
                  alert('알림 권한이 필요합니다.');
                }
              }}
              disabled={permission !== 'granted'}
            >
              브라우저 알림 테스트
            </button>
            
            <button 
              className="test-btn"
              onClick={sendTestNotification}
              disabled={permission !== 'granted'}
            >
              서비스워커 알림 테스트
            </button>
            
            <button 
              className="test-btn"
              onClick={getNotificationCount}
              disabled={permission !== 'granted'}
            >
              알림 개수 확인
            </button>
            
            <button 
              className="test-btn"
              onClick={clearAllNotifications}
              disabled={permission !== 'granted'}
            >
              모든 알림 클리어
            </button>
          </div>
        </div>

        <div className="demo-section">
          <h2>사용법</h2>
          <ol className="usage-list">
            <li>먼저 "권한 요청" 버튼을 클릭하여 알림 권한을 허용하세요.</li>
            <li>권한이 허용되면 "푸시 알림 구독" 버튼을 클릭하세요.</li>
            <li>구독이 완료되면 서버에서 푸시 알림을 보낼 수 있습니다.</li>
            <li><strong>테스트 기능들:</strong>
              <ul>
                <li>"UI 알림 테스트": 화면 내 토스트 알림을 테스트합니다.</li>
                <li>"브라우저 알림 테스트": 브라우저 네이티브 알림을 테스트합니다.</li>
                <li>"서비스워커 알림 테스트": 서비스워커를 통해 알림을 테스트합니다.</li>
                <li>"알림 개수 확인": 현재 표시된 알림의 개수를 확인합니다.</li>
                <li>"모든 알림 클리어": 모든 표시된 알림을 닫습니다.</li>
              </ul>
            </li>
            <li>서비스워커는 백그라운드에서 푸시 이벤트를 처리하고 알림을 표시합니다.</li>
            <li>알림을 클릭하면 해당 URL로 이동하거나 앱이 포커스됩니다.</li>
          </ol>
        </div>
      </main>

      <NotificationContainer />
    </div>
  );
}

export default App;
