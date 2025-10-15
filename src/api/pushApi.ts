import axios from 'axios';

// Axios 인스턴스 생성
const pushApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
}

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

// 테스트 푸시 알림 전송
export const sendPushNotification = async (message: string): Promise<PushTokenResponse> => {
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

export default pushApi;
