import { createRoot } from 'react-dom/client' // React 18의 새로운 클라이언트 API를 임포트합니다.
import './index.css' // 전역 CSS 스타일을 임포트합니다.
import App from './App.tsx' // 메인 애플리케이션 컴포넌트인 App을 임포트합니다.
import setupAxiosInterceptors from './api/axiosConfig.ts'; // 추가
import httpClient from './api/httpClient.ts'; // httpClient 임포트
import { BrowserRouter } from 'react-router-dom'; // 추가

/**
 * @description React 애플리케이션의 진입점 (Entry Point) 파일입니다.
 *
 * - `createRoot`를 사용하여 React 18의 동시성(Concurrent) 모드를 활성화합니다.
 * - `document.getElementById('root')`를 통해 HTML 문서의 'root' 엘리먼트를 찾아 React 앱을 마운트합니다.
 * - `<App />` 컴포넌트를 렌더링하여 전체 애플리케이션을 시작합니다.
 */

// Axios 인터셉터 설정
setupAxiosInterceptors(httpClient);

// PWA: 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
        // 서비스 워커의 업데이트를 강제로 확인합니다.
        // 이를 통해 캐시 문제를 우회하고 최신 서비스 워커가 설치되도록 보장합니다.
        registration.update();
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter> {/* BrowserRouter로 App 컴포넌트 래핑 */}
    <App />
  </BrowserRouter>
)