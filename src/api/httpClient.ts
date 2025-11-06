import axios from 'axios';

/**
 * @file httpClient.ts
 * @description 애플리케이션의 모든 API 요청에 사용되는 중앙 집중식 Axios 인스턴스입니다.
 *              기본 URL, 헤더, 인터셉터 등을 한 곳에서 관리하여 API 호출 로직의 일관성과 유지보수성을 높입니다.
 *              각 API 모듈에서 개별적으로 Axios 인스턴스를 생성하는 대신 이 클라이언트를 재사용하여 결합도를 낮춥니다.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request interceptors
httpClient.interceptors.request.use(
  (config) => {
    // Example: Add authorization token
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptors
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Example: Handle global errors (e.g., 401, 403)
    // if (error.response && error.response.status === 401) {
    //   // Redirect to login page or refresh token
    // }
    return Promise.reject(error);
  }
);

export default httpClient;