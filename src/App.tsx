import './App.css';
import { usePushNotification } from './hooks/usePushNotification';
import {
  NotificationContainer,
} from './components/notification/NotificationToast';

import CrawlingScheduler from './components/crawling/CrawlingScheduler';
import SubscribeButton from './components/notification/SubscribeButton';
import PushNotificationStatus from './components/notification/PushNotificationStatus';
import useUserStore from './store/useUserStore';
import WebSocketComp from './components/crawling/CrawlingTable';

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
  const userId = useUserStore((state) => state.userId);

  // usePushNotification 커스텀 훅을 사용하여 푸시 알림 관련 로직을 관리합니다.
  // 이 훅은 푸시 알림의 지원 여부, 권한 상태, 구독 여부, 구독 객체,
  // 그리고 권한 요청, 구독, 해지 함수를 제공합니다.
  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotification(userId);


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
          <PushNotificationStatus
            isSupported={isSupported}
            permission={permission}
            isSubscribed={isSubscribed}
          />
        </div>

        {/* 웹소켓 테스트 섹션 */}
        <div className="demo-section">
          {/* WebSocketTest 컴포넌트에 현재 사용자 ID를 전달합니다. */}
          <WebSocketComp/>
        </div>

        {/* 크롤링 스케줄러 섹션 */}
        <div className="demo-section">
          <CrawlingScheduler/>
        </div>
      </main>

      {/* 토스트 알림을 표시하는 컨테이너 컴포넌트 */}
      <NotificationContainer />
    </div>
  );
}

export default App;