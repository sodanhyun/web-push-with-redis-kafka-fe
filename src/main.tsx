import { createRoot } from 'react-dom/client' // React 18의 새로운 클라이언트 API를 임포트합니다.
import './index.css' // 전역 CSS 스타일을 임포트합니다.
import App from './App.tsx' // 메인 애플리케이션 컴포넌트인 App을 임포트합니다.

/**
 * @description React 애플리케이션의 진입점 (Entry Point) 파일입니다.
 *
 * - `createRoot`를 사용하여 React 18의 동시성(Concurrent) 모드를 활성화합니다.
 * - `document.getElementById('root')`를 통해 HTML 문서의 'root' 엘리먼트를 찾아 React 앱을 마운트합니다.
 * - `<App />` 컴포넌트를 렌더링하여 전체 애플리케이션을 시작합니다.
 */
createRoot(document.getElementById('root')!).render(
  <App />
)