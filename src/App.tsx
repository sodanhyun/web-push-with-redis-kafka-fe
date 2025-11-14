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
import { useEffect } from 'react';

const STORAGE_KEY = 'user-id-manual';

/**
 * @function App
 * @description 메인 애플리케이션 컴포넌트.
 * 푸시 알림 및 웹소켓 데모 기능을 제공합니다.
 */
function App() {
  // Zustand 스토어에서 상태와 액션을 개별적으로 선택하여 불필요한 리렌더링을 방지합니다.
  const userId = useUserStore((state) => state.userId);
  const setUserId = useUserStore((state) => state.setUserId);

  // 컴포넌트가 처음 마운트될 때 한 번만 실행되어 userId를 초기화합니다.
  useEffect(() => {
    let finalUserId = localStorage.getItem(STORAGE_KEY);

    if (!finalUserId) {
      // localStorage에 ID가 없으면 새로 생성하고 저장합니다.
      finalUserId = `user_${Date.now()}`;
      localStorage.setItem(STORAGE_KEY, finalUserId);
    }

    // 스토어의 상태를 최종 ID로 설정합니다.
    setUserId(finalUserId);
  }, [setUserId]); // setUserId는 항상 안정적이므로 이 훅은 한 번만 실행됩니다.


  // usePushNotification 커스텀 훅을 사용하여 푸시 알림 관련 로직을 관리합니다.
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