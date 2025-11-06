import httpClient from './httpClient'; // HTTP 요청을 위한 httpClient를 임포트합니다.

/**
 * @file pushApi.ts
 * @description 푸시 알림 관련 백엔드 API 호출을 담당하는 모듈입니다.
 *              중앙 집중식 `httpClient`를 사용하여 API 요청을 수행하며,
 *              푸시 구독 등록 및 테스트 푸시 알림 전송 기능을 제공합니다.
 */

/**
 * @interface PushTokenData
 * @description 푸시 토큰 정보를 정의하는 인터페이스입니다.
 * (현재 사용되지 않지만, 향후 확장성을 위해 정의되어 있습니다.)
 */
export interface PushTokenData {
  token: string; // 디바이스 푸시 토큰
  userId: string; // 사용자 ID
  deviceInfo: {
    userAgent: string; // 사용자 에이전트 문자열
    platform: string; // 운영체제 플랫폼
    language?: string; // 언어 (선택 사항)
    timezone?: string; // 시간대 (선택 사항)
  };
}

/**
 * @interface PushTokenResponse
 * @description 푸시 토큰 관련 API 응답 형식을 정의하는 인터페이스입니다.
 */
export interface PushTokenResponse {
  success: boolean; // 요청 성공 여부
  message: string; // 응답 메시지
  tokenId?: string; // 토큰 ID (선택 사항)
}

/**
 * @interface PushSubscriptionData
 * @description Web Push 구독 정보를 정의하는 인터페이스입니다.
 * 서비스 워커에서 생성된 구독 객체의 핵심 정보들을 포함합니다.
 */
export interface PushSubscriptionData {
  endpoint: string; // 푸시 서비스 엔드포인트 URL
  userId: string; // 구독과 연결될 사용자 ID
  keys: { // 암호화 키 정보
    p256dh: string; // P-256 elliptic curve Diffie-Hellman 공개 키 (Base64 인코딩)
    auth: string; // 인증 비밀 키 (Base64 인코딩)
  };
}

/**
 * @async
 * @function registerPushSubscription
 * @description 클라이언트의 푸시 구독 정보를 백엔드 서버에 등록합니다.
 *
 * @param {PushSubscriptionData} data - 서버에 등록할 푸시 구독 정보 객체입니다.
 * @returns {Promise<PushTokenResponse>} - 서버로부터의 응답 데이터를 포함하는 Promise입니다.
 * @throws {Error} - API 요청 실패 시 에러를 던집니다.
 */
export const registerPushSubscription = async (data: PushSubscriptionData): Promise<PushTokenResponse> => {
  try {
    // `/push/subscribe` 엔드포인트로 POST 요청을 보냅니다.
    const response = await httpClient.post<PushTokenResponse>('/push/subscribe', data);
    return response.data; // 서버 응답 데이터를 반환합니다.
  } catch (error) {
    console.error('Failed to register push subscription:', error); // 에러 로깅
    throw new Error('푸시 구독 등록에 실패했습니다.'); // 사용자 친화적인 에러 메시지 던지기
  }
};

/**
 * @async
 * @function sendPushNotification
 * @description 특정 사용자에게 테스트 푸시 알림을 전송하도록 백엔드 서버에 요청합니다.
 *
 * @param {string} userId - 알림을 받을 사용자의 ID입니다.
 * @param {string} message - 알림에 포함될 메시지 내용입니다.
 * @returns {Promise<PushTokenResponse>} - 서버로부터의 응답 데이터를 포함하는 Promise입니다.
 * @throws {Error} - API 요청 실패 시 에러를 던집니다.
 */
export const sendPushNotification = async (userId: string, message: string): Promise<PushTokenResponse> => {
  try {
    // `/notifications` 엔드포인트로 POST 요청을 보냅니다.
    // 요청 본문에는 userId와 message를 포함합니다.
    const response = await httpClient.post<PushTokenResponse>('/notifications', {
      userId,
      message,
      // title: '테스트 알림', // 필요에 따라 주석 해제하여 사용할 수 있습니다.
    });
    return response.data; // 서버 응답 데이터를 반환합니다.
  } catch (error) {
    console.error('Failed to send test push notification:', error); // 에러 로깅
    throw new Error('테스트 푸시 알림 전송에 실패했습니다.'); // 사용자 친화적인 에러 메시지 던지기
  }
};

/**
 * @interface PushNotificationSettings
 * @description 푸시 알림 설정 정보를 정의하는 인터페이스입니다.
 * (현재 사용되지 않지만, 향후 확장성을 위해 정의되어 있습니다.)
 */
export interface PushNotificationSettings {
  userId: string; // 사용자 ID
  enabled: boolean; // 푸시 알림 활성화 여부
  types: { // 알림 타입별 설정
    general: boolean; // 일반 알림
    marketing: boolean; // 마케팅 알림
    updates: boolean; // 업데이트 알림
    reminders: boolean; // 미리 알림
  };
  quietHours: { // 방해 금지 시간 설정
    enabled: boolean; // 방해 금지 시간 활성화 여부
    start: string; // 시작 시간 (HH:mm 형식)
    end: string;   // 종료 시간 (HH:mm 형식)
  };
}