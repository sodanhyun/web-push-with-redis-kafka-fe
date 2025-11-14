import axios from 'axios';

/**
 * @file httpClient.ts
 * @description 애플리케이션의 모든 API 요청에 사용되는 중앙 집중식 Axios 인스턴스입니다.
 *              기본 URL, 헤더 등을 한 곳에서 관리하여 API 호출 로직의 일관성과 유지보수성을 높입니다.
 *              각 API 모듈에서 개별적으로 Axios 인스턴스를 생성하는 대신 이 클라이언트를 재사용하여 결합도를 낮춥니다.
 *              인터셉터는 `axiosConfig.ts`에서 설정됩니다.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인터셉터는 axiosConfig.ts에서 설정되므로 여기서는 제거합니다.

export default httpClient;