import { useState, useEffect, useCallback } from 'react'; // React 훅들을 임포트합니다.

/**
 * @interface PushNotificationState
 * @description 푸시 알림 관련 상태를 정의하는 인터페이스입니다.
 */
interface PushNotificationState {
  isSupported: boolean; // 현재 브라우저가 푸시 알림을 지원하는지 여부
  permission: NotificationPermission; // 알림 권한 상태 ('granted', 'denied', 'default')
  isSubscribed: boolean; // 푸시 알림에 구독되어 있는지 여부
  subscription: PushSubscription | null; // 현재 푸시 구독 객체 (없으면 null)
  error: string | null; // 발생한 에러 메시지 (없으면 null)
}

/**
 * @interface PushNotificationActions
 * @description 푸시 알림 관련 액션 함수들을 정의하는 인터페이스입니다.
 */
interface PushNotificationActions {
  requestPermission: () => Promise<boolean>; // 사용자에게 알림 권한을 요청하는 함수
  subscribe: () => Promise<boolean>; // 푸시 알림을 구독하는 함수
  unsubscribe: () => Promise<boolean>; // 푸시 알림 구독을 해지하는 함수
  clearError: () => void; // 현재 에러 상태를 초기화하는 함수
}

/**
 * @function usePushNotification
 * @description 웹 푸시 알림 기능을 관리하는 커스텀 React 훅입니다.
 *
 * 이 훅은 다음을 제공합니다:
 * - 브라우저의 푸시 알림 지원 여부 확인
 * - 알림 권한 상태 관리 및 요청
 * - 푸시 서비스 구독 및 해지
 * - 구독 객체 및 에러 상태 관리
 *
 * @returns {PushNotificationState & PushNotificationActions}
 *          푸시 알림의 현재 상태와 관련 액션 함수들을 포함하는 객체
 */
export const usePushNotification = (): PushNotificationState & PushNotificationActions => {
  // 푸시 알림 관련 상태를 관리하는 useState 훅입니다.
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false, // 초기에는 지원 여부를 알 수 없음
    permission: 'default', // 초기 권한 상태는 'default'
    isSubscribed: false, // 초기에는 구독되지 않음
    subscription: null, // 초기 구독 객체는 null
    error: null, // 초기 에러 상태는 null
  });

  /**
   * @function registerServiceWorker
   * @description 서비스 워커를 등록하는 비동기 함수입니다.
   *
   * - `navigator.serviceWorker` API를 사용하여 `/sw.js` 파일을 서비스 워커로 등록합니다.
   * - 등록 성공 시 `ServiceWorkerRegistration` 객체를 반환하고, 실패 시 에러를 로깅합니다.
   * - `useCallback`을 사용하여 이 함수가 컴포넌트 렌더링 시마다 재생성되지 않도록 최적화합니다.
   * @returns {Promise<ServiceWorkerRegistration | null>} 등록된 서비스 워커 객체 또는 실패 시 null
   */
  const registerServiceWorker = useCallback(async () => {
    // 브라우저가 서비스 워커를 지원하는지 확인합니다.
    if ('serviceWorker' in navigator) {
      try {
        // `/sw.js` 경로의 서비스 워커 파일을 등록합니다.
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        // 서비스 워커 등록 실패 시 에러 상태를 업데이트합니다.
        setState(prev => ({ ...prev, error: '서비스워커 등록에 실패했습니다.' }));
        return null;
      }
    }
    return null;
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트 마운트 시 한 번만 생성됩니다.

  /**
   * @function checkSupport
   * @description 현재 브라우저가 푸시 알림을 지원하는지 확인하는 함수입니다.
   *
   * - `navigator.serviceWorker`와 `window.PushManager` 객체의 존재 여부로 지원 여부를 판단합니다.
   * - `useCallback`을 사용하여 이 함수가 컴포넌트 렌더링 시마다 재생성되지 않도록 최적화합니다.
   * @returns {boolean} 푸시 알림 지원 여부
   */
  const checkSupport = useCallback(() => {
    // 서비스 워커와 PushManager API가 모두 존재하는지 확인합니다.
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    // 상태를 업데이트합니다.
    setState(prev => ({ ...prev, isSupported }));
    return isSupported;
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트 마운트 시 한 번만 생성됩니다.

  /**
   * @async
   * @function requestPermission
   * @description 사용자에게 알림 권한을 요청하는 비동기 함수입니다.
   *
   * - 브라우저가 푸시 알림을 지원하지 않으면 에러를 설정하고 false를 반환합니다.
   * - `Notification.requestPermission()`을 호출하여 권한 요청 팝업을 띄웁니다.
   * - 권한 상태를 업데이트하고, 'granted'인 경우 true, 그렇지 않으면 false를 반환합니다.
   * - `useCallback`을 사용하여 이 함수가 컴포넌트 렌더링 시마다 재생성되지 않도록 최적화합니다.
   * @returns {Promise<boolean>} 권한 요청 성공 여부
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // 푸시 알림이 지원되지 않으면 에러를 설정하고 종료합니다.
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: '푸시 알림을 지원하지 않는 브라우저입니다.' }));
      return false;
    }

    try {
      // 사용자에게 알림 권한을 요청합니다.
      const permission = await Notification.requestPermission();
      // 요청 결과에 따라 권한 상태를 업데이트합니다.
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        return true; // 권한 허용됨
      } else {
        // 권한이 거부되거나 기본값인 경우 에러를 설정합니다.
        setState(prev => ({ ...prev, error: '푸시 알림 권한이 거부되었습니다.' }));
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      // 권한 요청 중 에러 발생 시 에러 상태를 업데이트합니다.
      setState(prev => ({ ...prev, error: '권한 요청에 실패했습니다.' }));
      return false;
    }
  }, [state.isSupported]); // `isSupported` 상태가 변경될 때마다 이 함수를 재생성합니다.

  /**
   * @async
   * @function subscribe
   * @description 푸시 알림 서비스에 구독하는 비동기 함수입니다.
   *
   * - 알림 권한이 'granted'가 아니면 에러를 설정하고 false를 반환합니다.
   * - 서비스 워커 등록 객체를 가져와 `pushManager.subscribe()`를 호출합니다.
   * - `userVisibleOnly: true`는 모든 푸시 메시지가 사용자에게 표시되어야 함을 의미합니다.
   * - `applicationServerKey`는 VAPID 공개 키로, 환경 변수에서 가져옵니다.
   * - 구독 성공 시 `isSubscribed`와 `subscription` 상태를 업데이트합니다.
   * - `useCallback`을 사용하여 이 함수가 컴포넌트 렌더링 시마다 재생성되지 않도록 최적화합니다.
   * @returns {Promise<boolean>} 구독 성공 여부
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    // 알림 권한이 없으면 구독을 시도하지 않습니다.
    if (state.permission !== 'granted') {
      setState(prev => ({ ...prev, error: '푸시 알림 권한이 필요합니다.' }));
      return false;
    }

    try {
      // 서비스 워커가 준비될 때까지 기다립니다.
      const registration = await navigator.serviceWorker.ready;
      // 푸시 서비스에 구독을 요청합니다.
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // 사용자에게 항상 알림이 표시되도록 설정
        applicationServerKey: import.meta.env.VITE_APP_VAPID_PUBLIC_KEY // VAPID 공개 키
      });

      // 구독 성공 시 상태를 업데이트합니다.
      setState(prev => ({ 
        ...prev,
        isSubscribed: true,
        subscription,
        error: null // 에러 상태 초기화
      }));

      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      // 구독 실패 시 에러 상태를 업데이트합니다.
      setState(prev => ({ ...prev, error: '푸시 구독에 실패했습니다.' }));
      return false;
    }
  }, [state.permission]); // `permission` 상태가 변경될 때마다 이 함수를 재생성합니다.

  /**
   * @async
   * @function unsubscribe
   * @description 푸시 알림 서비스 구독을 해지하는 비동기 함수입니다.
   *
   * - 현재 구독 객체가 없으면 false를 반환합니다.
   * - `subscription.unsubscribe()`를 호출하여 구독을 해지합니다.
   * - 해지 성공 시 `isSubscribed`와 `subscription` 상태를 초기화합니다.
   * - `useCallback`을 사용하여 이 함수가 컴포넌트 렌더링 시마다 재생성되지 않도록 최적화합니다.
   * @returns {Promise<boolean>} 구독 해지 성공 여부
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    // 현재 구독 객체가 없으면 해지할 것이 없으므로 false를 반환합니다.
    if (!state.subscription) {
      return false;
    }

    try {
      // 현재 구독을 해지합니다.
      await state.subscription.unsubscribe();
      // 해지 성공 시 상태를 업데이트합니다.
      setState(prev => ({ 
        ...prev,
        isSubscribed: false,
        subscription: null,
        error: null // 에러 상태 초기화
      }));
      return true;
    } catch (error) {
      console.error('Unsubscription failed:', error);
      // 해지 실패 시 에러 상태를 업데이트합니다.
      setState(prev => ({ ...prev, error: '구독 해제에 실패했습니다.' }));
      return false;
    }
  }, [state.subscription]); // `subscription` 객체가 변경될 때마다 이 함수를 재생성합니다.

  /**
   * @function clearError
   * @description 현재 설정된 에러 메시지를 초기화하는 함수입니다.
   * `useCallback`을 사용하여 이 함수가 컴포넌트 렌더링 시마다 재생성되지 않도록 최적화합니다.
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트 마운트 시 한 번만 생성됩니다.

  /**
   * @useEffect
   * @description 훅이 마운트될 때 초기화 작업을 수행합니다.
   *
   * - 브라우저의 푸시 알림 지원 여부를 확인합니다.
   * - 지원하는 경우 서비스 워커를 등록하고, 현재 알림 권한 상태를 확인합니다.
   * - 기존에 활성화된 푸시 구독이 있는지 확인하고, 있다면 상태를 업데이트합니다.
   */
  useEffect(() => {
    const initialize = async () => {
      // 1. 푸시 알림 지원 여부 확인 및 상태 업데이트
      checkSupport();

      // 2. 푸시 알림이 지원되는 경우 추가 초기화 진행
      if (state.isSupported) {
        // 3. 서비스 워커 등록
        await registerServiceWorker();

        // 4. 현재 알림 권한 상태 확인 및 상태 업데이트
        setState(prev => ({ ...prev, permission: Notification.permission }));

        // 5. 기존 푸시 구독 확인
        try {
          // 서비스 워커가 준비될 때까지 기다립니다.
          const registration = await navigator.serviceWorker.ready;
          // 현재 활성화된 푸시 구독 객체를 가져옵니다.
          const subscription = await registration.pushManager.getSubscription();

          // 기존 구독이 존재하면 상태를 업데이트합니다.
          if (subscription) {
            setState(prev => ({
              ...prev,
              isSubscribed: true,
              subscription
            }));
          }
        } catch (error) {
          console.error('Failed to get existing subscription:', error);
          // 기존 구독을 가져오는 데 실패해도 에러로 처리하지 않고 로깅만 합니다.
          // 이는 사용자가 구독을 해지했거나 브라우저 설정 변경 등으로 인해 발생할 수 있습니다.
        }
      }
    };

    initialize();
  }, [checkSupport, registerServiceWorker, state.isSupported]); // 의존성 배열에 있는 값들이 변경될 때마다 초기화 함수를 재실행합니다.

  // 훅의 상태와 액션 함수들을 반환합니다.
  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    clearError,
  };
};