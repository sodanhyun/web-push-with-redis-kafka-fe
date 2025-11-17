/**
 * @file App.tsx
 * @description 애플리케이션의 메인 컴포넌트입니다.
 *              React Router를 사용하여 라우팅을 설정하고,
 *              푸시 알림, 실시간 크롤링 진행 상황, 크롤링 스케줄 관리 기능을 통합하여 렌더링합니다.
 */

import './App.css';
import useServiceWorkerMessages from './hooks/useServiceWorkerMessages';
import { usePushNotification } from './hooks/usePushNotification';
import { NotificationContainer } from './components/notification/NotificationToast'; // 불필요한 쉼표 제거

import CrawlingScheduler from './components/crawling/CrawlingScheduler';
import SubscribeButton from './components/notification/SubscribeButton';
import PushNotificationStatus from './components/notification/PushNotificationStatus';
import CrawlingTable from './components/crawling/CrawlingTable';
// import { type JSX } from 'react'; // JSX.Element를 직접 사용하므로 불필요
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import useAuthStore from './store/useAuthStore'; // 사용자 인증 상태를 관리하는 Zustand 스토어
import type { JSX } from 'react';

/**
 * @function App
 * @description 애플리케이션의 최상위 컴포넌트입니다.
 *              인증 상태에 따라 라우팅을 제어하고, 주요 기능 컴포넌트들을 통합하여 표시합니다.
 */
function App() {
  // 서비스 워커로부터 오는 메시지를 처리하는 훅을 호출합니다.
  useServiceWorkerMessages();
  
  // useAuthStore에서 사용자 인증 상태와 userId를 가져옵니다.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.userId);

  // usePushNotification 훅을 사용하여 푸시 알림 관련 상태와 함수들을 가져옵니다.
  // userId가 null일 경우 빈 문자열을 전달하여 훅 내부에서 처리하도록 합니다.
  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotification(userId || '');

  /**
   * @function PrivateRoute
   * @description 인증된 사용자만 접근할 수 있는 라우트를 정의하는 헬퍼 컴포넌트입니다.
   * @param {object} props - React children을 포함하는 props
   * @param {JSX.Element} props.children - PrivateRoute 내부에 렌더링될 컴포넌트
   * @returns {JSX.Element} 인증 상태에 따라 자식 컴포넌트 또는 로그인 페이지로 리다이렉트
   */
  const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Routes>
      {/* 로그인 페이지 라우트 */}
      <Route path="/login" element={<Login />} />
      {/* 메인 애플리케이션 라우트 (인증 필요) */}
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
                    {/* 푸시 알림 구독/해지 버튼 컴포넌트 */}
                    <SubscribeButton
                      permission={permission}
                      isSupported={isSupported} // isSupported prop 추가
                      isSubscribed={isSubscribed}
                      requestPermission={requestPermission}
                      subscribe={subscribe}
                      unsubscribe={unsubscribe}
                    />
                  </div>
                  {/* 푸시 알림 지원 여부 및 권한 상태 표시 컴포넌트 */}
                  <PushNotificationStatus
                    isSupported={isSupported}
                    permission={permission}
                    isSubscribed={isSubscribed}
                  />
                </div>

                {/* 웹소켓 크롤링 진행 상황 표시 섹션 */}
                <div className="demo-section">
                  <CrawlingTable/>
                </div>

                {/* 크롤링 스케줄러 관리 섹션 */}
                <div className="demo-section">
                  <CrawlingScheduler/>
                </div>
              </main>

              {/* 전역 토스트 알림 컨테이너 */}
              <NotificationContainer />
            </div>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
