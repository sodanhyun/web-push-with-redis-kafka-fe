/**
 * @file main.tsx
 * @description React 애플리케이션의 메인 진입점(Entry Point) 파일입니다.
 *              React 앱을 DOM에 마운트하고, 전역적인 설정(Axios 인터셉터, 서비스 워커 등록)을 수행합니다.
 */

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import setupAxiosInterceptors from './api/axiosConfig.ts';
import httpClient from './api/httpClient.ts';
import { BrowserRouter } from 'react-router-dom';

/**
 * @description React 애플리케이션의 진입점 (Entry Point) 파일입니다.
 *
 * - `createRoot`를 사용하여 React 18의 새로운 클라이언트 API를 통해 앱을 마운트합니다.
 * - `document.getElementById('root')`를 통해 HTML 문서의 'root' 엘리먼트를 찾아 React 앱을 마운트합니다.
 * - `<App />` 컴포넌트를 렌더링하여 전체 애플리케이션을 시작합니다.
 */

// Axios 인터셉터 설정: 모든 API 요청에 인증 토큰을 자동으로 추가하고,
// 401 에러 발생 시 토큰 재발급 로직을 처리하도록 설정합니다.
setupAxiosInterceptors(httpClient);

// PWA: 서비스 워커 등록
// 브라우저가 Service Worker를 지원하는지 확인합니다.
if ('serviceWorker' in navigator) {
  // 페이지 로드 완료 후 Service Worker를 등록합니다.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
        // 서비스 워커의 업데이트를 강제로 확인하여 항상 최신 버전을 사용하도록 보장합니다.
        registration.update();
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

// React 애플리케이션을 DOM에 렌더링합니다.
// <BrowserRouter>로 <App /> 컴포넌트를 감싸서 클라이언트 측 라우팅을 활성화합니다.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
