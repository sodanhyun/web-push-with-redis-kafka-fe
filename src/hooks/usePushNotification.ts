/**
 * @file usePushNotification.ts
 * @description 웹 푸시 알림 기능을 관리하는 커스텀 React 훅입니다.
 *              브라우저의 푸시 알림 지원 여부 확인, 알림 권한 관리, 푸시 서비스 구독 및 해지,
 *              그리고 관련 상태(구독 객체, 에러)를 관리합니다.
 *              서버에 푸시 구독 정보를 등록하는 로직도 이 훅 내부에 포함되어 응집도를 높였습니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { registerPushSubscription } from '../api/pushApi';

/**
 * @interface PushNotificationState
 * @description 푸시 알림 기능의 현재 상태를 정의하는 인터페이스입니다.
 */
interface PushNotificationState {
  isSupported: boolean;           // 브라우저가 푸시 알림을 지원하는지 여부
  permission: NotificationPermission; // 현재 알림 권한 상태 ('granted', 'denied', 'default')
  isSubscribed: boolean;          // 푸시 알림에 구독되어 있는지 여부
  subscription: PushSubscription | null; // 현재 푸시 구독 객체 (없으면 null)
  error: string | null;           // 발생한 에러 메시지 (없으면 null)
}

/**
 * @interface PushNotificationActions
 * @description 푸시 알림 기능과 관련된 액션 함수들을 정의하는 인터페이스입니다.
 */
interface PushNotificationActions {
  requestPermission: () => Promise<boolean>; // 사용자에게 알림 권한을 요청하는 비동기 함수
  subscribe: () => Promise<boolean>;         // 푸시 알림 서비스에 구독하는 비동기 함수
  unsubscribe: () => Promise<boolean>;       // 푸시 알림 구독을 해지하는 비동기 함수
  clearError: () => void;                    // 현재 에러 상태를 초기화하는 함수
}

/**
 * @function isPushSupported
 * @description 현재 브라우저가 서비스 워커와 푸시 알림 API를 지원하는지 확인하는 헬퍼 함수입니다.
 * @returns {boolean} 푸시 알림 지원 여부
 */
const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window;

/**
 * @hook usePushNotification
 * @description 웹 푸시 알림 기능을 관리하는 커스텀 React 훅입니다.
 *              브라우저의 푸시 알림 지원 여부 확인, 알림 권한 관리, 푸시 서비스 구독 및 해지,
 *              그리고 관련 상태(구독 객체, 에러)를 관리합니다.
 *              `userId`를 인자로 받아 서버에 구독 정보를 등록할 때 사용합니다.
 *
 * @param {string} userId - 현재 사용자의 고유 ID. 서버에 구독 정보를 등록할 때 사용됩니다.
 * @returns {PushNotificationState & PushNotificationActions}
 *          푸시 알림의 현재 상태와 관련 액션 함수들을 포함하는 객체
 */
export const usePushNotification = (userId: string): PushNotificationState & PushNotificationActions => {
  /**
   * @property {PushNotificationState} state
   * @description 푸시 알림 관련 상태를 관리하는 React의 `useState` 훅입니다.
   */
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
    error: null,
  });

  /**
   * @hook useEffect
   * @description 컴포넌트가 마운트될 때 한 번 실행되어 푸시 알림 기능을 초기화합니다.
   *              브라우저 지원 여부 확인, 권한 상태 설정, 기존 구독 정보 로드 등을 수행합니다.
   */
  useEffect(() => {
    const initialize = async () => {
      // 1. 푸시 알림 지원 여부 확인
      if (isPushSupported()) {
        // 2. 지원하는 경우, 상태 업데이트 및 현재 알림 권한 설정
        setState(prev => ({ ...prev, isSupported: true, permission: Notification.permission }));

        // 3. 기존 푸시 구독 정보 확인 및 로드
        try {
          // 서비스 워커가 활성화될 때까지 기다립니다.
          const registration = await navigator.serviceWorker.ready;
          // 현재 활성화된 푸시 구독 객체를 가져옵니다.
          const subscription = await registration.pushManager.getSubscription();

          // 기존 구독이 존재하면 상태를 업데이트합니다.
          if (subscription) {
            setState(prev => ({ ...prev, isSubscribed: true, subscription }));
          }
        } catch (error) {
          console.error('Error getting existing subscription:', error);
          // 기존 구독 로드 실패는 치명적이지 않으므로 에러 상태를 설정하지 않고 로깅만 합니다.
        }
      } else {
        // 4. 푸시 알림을 지원하지 않는 경우, 관련 상태를 업데이트합니다.
        setState(prev => ({ ...prev, isSupported: false, error: 'Push notifications are not supported by this browser.' }));
      }
    };

    initialize();
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트 마운트 시 한 번만 실행됩니다.

  /**
   * @hook useEffect
   * @description 푸시 구독 정보가 변경되거나 구독 상태가 활성화될 때 서버에 구독 정보를 전송합니다.
   *              `userId`를 사용하여 현재 사용자의 구독 정보를 백엔드에 등록합니다.
   *
   * - `state.subscription` 객체가 존재하고 `state.isSubscribed`가 true일 때 실행됩니다.
   * - 구독 객체에서 `endpoint`, `p256dh` 키, `auth` 키를 추출하여 서버에 전송할 형식으로 변환합니다.
   * - `registerPushSubscription` API를 호출하여 서버에 구독 정보를 등록합니다.
   * - 오류 발생 시 콘솔에 에러를 로깅합니다.
   */
  useEffect(() => {
    if (state.subscription && state.isSubscribed) {
      const sendSubscriptionToServer = async () => {
        try {
          // Web Push 표준에 맞는 구독 정보를 구성합니다.
          // p256dh 및 auth 키는 Uint8Array 형태이므로 Base64 문자열로 변환합니다.
          const subscriptionData = {
            endpoint: state.subscription!.endpoint,
            userId: userId, // 현재 사용자 ID를 함께 전송합니다.
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(state.subscription!.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(state.subscription!.getKey('auth')!))),
            },
          };

          // 서버 API를 호출하여 구독 정보를 등록합니다.
          await registerPushSubscription(subscriptionData);
          console.log('푸시 구독 정보가 서버에 등록되었습니다.');
        } catch (error) {
          console.error('서버에 구독 정보 전송 실패:', error);
        }
      };

      sendSubscriptionToServer();
    }
  }, [state.subscription, state.isSubscribed, userId]); // userId를 의존성 배열에 추가하여 변경 시 재실행되도록 합니다.

  /**
   * @function requestPermission
   * @description 사용자에게 알림 권한을 요청하는 비동기 함수입니다.
   *              권한 요청 결과에 따라 상태를 업데이트합니다.
   * @returns {Promise<boolean>} 권한 요청 성공 여부 (granted: true, denied/default: false)
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setState(prev => ({ ...prev, error: '푸시 알림을 지원하지 않는 브라우저입니다.' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        return true;
      } else {
        setState(prev => ({ ...prev, error: '푸시 알림 권한이 거부되었습니다.' }));
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setState(prev => ({ ...prev, error: '권한 요청에 실패했습니다.' }));
      return false;
    }
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트 렌더링 시마다 재생성되지 않습니다.

  /**
   * @function subscribe
   * @description 푸시 알림 서비스에 구독을 요청하는 비동기 함수입니다.
   *              성공 시 구독 객체를 상태에 저장합니다.
   * @returns {Promise<boolean>} 구독 성공 여부
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (state.permission !== 'granted') {
      setState(prev => ({ ...prev, error: '푸시 알림 권한이 필요합니다.' }));
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // 사용자에게 항상 알림이 표시되도록 설정
        applicationServerKey: import.meta.env.VITE_APP_VAPID_PUBLIC_KEY, // VAPID 공개 키
      });

      setState(prev => ({ ...prev, isSubscribed: true, subscription, error: null }));
      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      setState(prev => ({ ...prev, error: '푸시 구독에 실패했습니다.' }));
      return false;
    }
  }, [state.permission]); // `permission` 상태가 변경될 때마다 이 함수를 재생성합니다.

  /**
   * @function unsubscribe
   * @description 푸시 알림 서비스 구독을 해지하는 비동기 함수입니다.
   *              성공 시 구독 객체를 상태에서 제거합니다.
   * @returns {Promise<boolean>} 구독 해지 성공 여부
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return false;
    }

    try {
      await state.subscription.unsubscribe();
      setState(prev => ({ ...prev, isSubscribed: false, subscription: null, error: null }));
      return true;
    } catch (error) {
      console.error('Unsubscription failed:', error);
      setState(prev => ({ ...prev, error: '구독 해제에 실패했습니다.' }));
      return false;
    }
  }, [state.subscription]); // `subscription` 객체가 변경될 때마다 이 함수를 재생성합니다.

  /**
   * @function clearError
   * @description 현재 설정된 에러 메시지를 초기화하는 함수입니다.
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트 렌더링 시마다 재생성되지 않습니다.

  /**
   * @returns {PushNotificationState & PushNotificationActions}
   * @description 훅의 현재 상태와 액션 함수들을 반환합니다.
   */
  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    clearError,
  };
};
