/**
 * @file axiosConfig.ts
 * @description Axios 인스턴스에 요청 및 응답 인터셉터를 설정하여 JWT 기반 인증을 처리하고,
 *              401 Unauthorized 응답 시 Refresh Token을 사용하여 Access Token을 재발급받는 로직을 구현합니다.
 */

import type { AxiosInstance } from 'axios';
import useAuthStore from '../store/useAuthStore'; // 인증 상태를 관리하는 Zustand 스토어

/**
 * @function setupAxiosInterceptors
 * @description 주어진 Axios 인스턴스에 요청 및 응답 인터셉터를 설정합니다.
 * @param {AxiosInstance} apiClient - 인터셉터를 설정할 Axios 인스턴스
 */
const setupAxiosInterceptors = (apiClient: AxiosInstance) => {
  // 요청 인터셉터: 모든 HTTP 요청에 Access Token을 Authorization 헤더에 추가합니다.
  apiClient.interceptors.request.use(
    (config) => {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터: 401 Unauthorized 에러 발생 시 Refresh Token을 사용하여 Access Token을 재발급받습니다.
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      // 401 에러 발생 시 Refresh Token을 사용하여 Access Token 재발급 시도
      // _retry 플래그는 무한 루프 방지를 위해 사용됩니다.
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // 재시도 플래그 설정
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) {
            // Refresh Token이 없으면 로그아웃 처리 후 로그인 페이지로 리다이렉트
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(error);
          }

          // Refresh Token을 사용하여 새로운 Access Token 요청
          // 백엔드에 /auth/refresh 엔드포인트가 필요합니다.
          // apiClient의 baseURL이 이미 설정되어 있으므로 상대 경로로 호출합니다.
          const response = await apiClient.post('/auth/refresh', { refreshToken }); // VITE_API_URL 제거
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          useAuthStore.getState().login(newAccessToken, newRefreshToken); // 새 토큰 저장
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`; // 원래 요청의 Authorization 헤더 업데이트
          return apiClient(originalRequest); // 원래 요청 재시도
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          // Refresh Token 재발급 실패 시 로그아웃 처리 후 로그인 페이지로 리다이렉트
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;