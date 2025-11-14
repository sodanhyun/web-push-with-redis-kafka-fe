import './App.css';
import { usePushNotification } from './hooks/usePushNotification';
import {
  NotificationContainer,
} from './components/notification/NotificationToast';

import CrawlingScheduler from './components/crawling/CrawlingScheduler';
import SubscribeButton from './components/notification/SubscribeButton';
import PushNotificationStatus from './components/notification/PushNotificationStatus';
import CrawlingTable from './components/crawling/CrawlingTable';
import { type JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import useAuthStore from './store/useAuthStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.userId);

  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotification(userId || '');

  const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
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
                  <CrawlingTable/>
                </div>

                {/* 크롤링 스케줄러 섹션 */}
                <div className="demo-section">
                  <CrawlingScheduler/>
                </div>
              </main>

              <NotificationContainer />
            </div>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;