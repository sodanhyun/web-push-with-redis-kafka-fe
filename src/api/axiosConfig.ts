
import type { AxiosInstance } from 'axios';
import useAuthStore from '../store/useAuthStore';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const setupAxiosInterceptors = (apiClient: AxiosInstance) => {
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

  // TODO: Refresh Token 로직 추가 (401 Unauthorized 응답 시)
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      // 401 에러 발생 시 Refresh Token을 사용하여 Access Token 재발급 시도
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
          if (!refreshToken) {
            useAuthStore.getState().logout();
            // 로그인 페이지로 리다이렉트
            window.location.href = '/login';
            return Promise.reject(error);
          }

          // Refresh Token을 사용하여 새로운 Access Token 요청 (백엔드에 /api/auth/refresh 엔드포인트 필요)
          const response = await apiClient.post(`${VITE_API_URL}/auth/refresh`, { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          useAuthStore.getState().login(newAccessToken, newRefreshToken); // 새 토큰 저장
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest); // 원래 요청 재시도
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          useAuthStore.getState().logout();
          // 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
