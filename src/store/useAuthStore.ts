/**
 * @file useAuthStore.ts
 * @description Zustand를 사용하여 사용자 인증 상태(JWT 토큰, 인증 여부, 사용자 ID)를 전역적으로 관리하는 스토어입니다.
 *              localStorage를 사용하여 토큰 정보를 지속적으로 유지하며, 애플리케이션 전반에서 인증 상태를 공유합니다.
 */

import { create } from 'zustand';

/**
 * @function decodeJwt
 * @description JWT(JSON Web Token)를 디코딩하여 페이로드(payload)를 파싱하는 헬퍼 함수입니다.
 *              토큰의 'sub' 클레임에서 사용자 ID를 추출하는 데 사용됩니다.
 * @param {string} token - 디코딩할 JWT 문자열
 * @returns {any | null} 디코딩된 JWT 페이로드 객체 또는 디코딩 실패 시 `null`
 */
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1]; // JWT의 두 번째 부분(페이로드)을 가져옵니다.
    // URL-safe Base64를 일반 Base64로 변환합니다.
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Base64 디코딩 후 URI 컴포넌트 디코딩을 통해 JSON 문자열을 얻습니다.
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload); // JSON 문자열을 객체로 파싱하여 반환합니다.
  } catch (e) {
    console.error("Error decoding JWT:", e); // 디코딩 중 에러 발생 시 로깅
    return null;
  }
};

/**
 * @interface AuthState
 * @description useAuthStore에서 관리하는 인증 관련 상태의 타입을 정의합니다.
 */
interface AuthState {
  accessToken: string | null;   // 현재 사용자의 JWT 액세스 토큰
  refreshToken: string | null;  // 현재 사용자의 JWT 리프레시 토큰
  isAuthenticated: boolean;     // 사용자가 인증되었는지 여부
  userId: string | null;        // 현재 로그인한 사용자의 고유 ID (JWT에서 추출)
  login: (accessToken: string, refreshToken: string) => void; // 로그인 처리 함수
  logout: () => void;           // 로그아웃 처리 함수
}

/**
 * @hook useAuthStore
 * @description Zustand 스토어를 사용하여 사용자 인증 상태를 전역적으로 관리합니다.
 *              localStorage를 통해 토큰을 지속적으로 유지하고, 로그인/로그아웃 기능을 제공합니다.
 */
const useAuthStore = create<AuthState>((set) => ({
  // 초기 상태: localStorage에서 액세스 토큰을 로드하거나 null
  accessToken: localStorage.getItem('accessToken') || null,
  // 초기 상태: localStorage에서 리프레시 토큰을 로드하거나 null
  refreshToken: localStorage.getItem('refreshToken') || null,
  // 초기 상태: 액세스 토큰 존재 여부로 인증 상태 결정
  isAuthenticated: !!localStorage.getItem('accessToken'),
  // 초기 상태: userId는 null (initializeAuthStore에서 설정)
  userId: null,

  /**
   * @method login
   * @description 사용자가 성공적으로 로그인했을 때 호출되는 함수입니다.
   *              액세스 토큰과 리프레시 토큰을 localStorage에 저장하고,
   *              JWT에서 userId를 추출하여 스토어 상태를 업데이트합니다.
   * @param {string} accessToken - 서버로부터 받은 JWT 액세스 토큰
   * @param {string} refreshToken - 서버로부터 받은 JWT 리프레시 토큰
   */
  login: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const decodedToken = decodeJwt(accessToken);
    const userId = decodedToken ? decodedToken.sub : null; // JWT 페이로드의 'sub' 클레임에서 userId 추출

    set({ accessToken, refreshToken, isAuthenticated: true, userId });
  },

  /**
   * @method logout
   * @description 사용자가 로그아웃했을 때 호출되는 함수입니다.
   *              localStorage에서 토큰 정보를 제거하고, 스토어 상태를 초기화합니다.
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, isAuthenticated: false, userId: null }); // 모든 인증 관련 상태를 null 또는 false로 설정
  },
}));

/**
 * @function initializeAuthStore
 * @description 애플리케이션 시작 시 localStorage에 저장된 토큰을 확인하고,
 *              유효한 토큰이 있다면 userId를 추출하여 스토어 상태를 초기화하는 함수입니다.
 *              새로고침 시에도 사용자 인증 상태를 유지하는 데 사용됩니다.
 */
const initializeAuthStore = () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    const decodedToken = decodeJwt(accessToken);
    const userId = decodedToken ? decodedToken.sub : null;
    useAuthStore.setState({ userId }); // 스토어의 userId 상태만 업데이트
  }
};
initializeAuthStore(); // 스토어 정의 후 즉시 호출하여 초기화

export default useAuthStore;