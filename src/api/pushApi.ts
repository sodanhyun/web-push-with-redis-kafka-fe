import axios from 'axios';

// Axios 인스턴스 생성
const pushApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
// pushApi.interceptors.request.use(
//   (config) => {
//     // 토큰이 있다면 헤더에 추가
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     console.log('API Request:', config.method?.toUpperCase(), config.url);
//     return config;
//   },
//   (error) => {
//     console.error('Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// 응답 인터셉터
pushApi.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.config?.url);
    
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    // if (error.response?.status === 401) {
    //   localStorage.removeItem('authToken');
    //   // window.location.href = '/login';
    // }
    
    return Promise.reject(error);
  }
);

// 푸시 토큰 관련 API 타입 정의
export interface PushTokenData {
  token: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language?: string;
    timezone?: string;
  };
}

export interface PushTokenResponse {
  success: boolean;
  message: string;
  tokenId?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  // userId: string;
  // deviceInfo: {
  //   userAgent: string;
  //   platform: string;
  //   language?: string;
  //   timezone?: string;
  // };
}

// 푸시 토큰을 서버에 등록
// export const registerPushToken = async (data: PushTokenData): Promise<PushTokenResponse> => {
//   try {
//     const response = await pushApi.post<PushTokenResponse>('/push-token', data);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to register push token:', error);
//     throw new Error('푸시 토큰 등록에 실패했습니다.');
//   }
// };

// 푸시 구독 정보를 서버에 등록
export const registerPushSubscription = async (data: PushSubscriptionData): Promise<PushTokenResponse> => {
  try {
    const response = await pushApi.post<PushTokenResponse>('/push/subscribe', data);
    return response.data;
  } catch (error) {
    console.error('Failed to register push subscription:', error);
    throw new Error('푸시 구독 등록에 실패했습니다.');
  }
};

// 푸시 토큰 삭제
// export const deletePushToken = async (tokenId: string): Promise<PushTokenResponse> => {
//   try {
//     const response = await pushApi.delete<PushTokenResponse>(`/push-token/${tokenId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to delete push token:', error);
//     throw new Error('푸시 토큰 삭제에 실패했습니다.');
//   }
// };

// 사용자의 모든 푸시 토큰 조회
// export const getUserPushTokens = async (userId: string): Promise<PushTokenData[]> => {
//   try {
//     const response = await pushApi.get<PushTokenData[]>(`/push-tokens/${userId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to get user push tokens:', error);
//     throw new Error('푸시 토큰 조회에 실패했습니다.');
//   }
// };

// 테스트 푸시 알림 전송
export const sendTestPushNotification = async (userId: string, message: string): Promise<PushTokenResponse> => {
  try {
    const response = await pushApi.post<PushTokenResponse>('/notifications', {
      // userId,
      message,
      // title: '테스트 알림',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send test push notification:', error);
    throw new Error('테스트 푸시 알림 전송에 실패했습니다.');
  }
};

// 푸시 알림 설정 업데이트
export interface PushNotificationSettings {
  userId: string;
  enabled: boolean;
  types: {
    general: boolean;
    marketing: boolean;
    updates: boolean;
    reminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

// export const updatePushSettings = async (settings: PushNotificationSettings): Promise<PushTokenResponse> => {
//   try {
//     const response = await pushApi.put<PushTokenResponse>('/push-settings', settings);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to update push settings:', error);
//     throw new Error('푸시 알림 설정 업데이트에 실패했습니다.');
//   }
// };

// 푸시 알림 설정 조회
// export const getPushSettings = async (userId: string): Promise<PushNotificationSettings> => {
//   try {
//     const response = await pushApi.get<PushNotificationSettings>(`/push-settings/${userId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to get push settings:', error);
//     throw new Error('푸시 알림 설정 조회에 실패했습니다.');
//   }
// };

export default pushApi;
