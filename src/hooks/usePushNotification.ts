import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

interface PushNotificationActions {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => void;
  clearError: () => void;
}

export const usePushNotification = (): PushNotificationState & PushNotificationActions => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
    error: null,
  });

  const sendTestNotification = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SEND_TEST_NOTIFICATION',
        data: {
          title: '테스트 알림',
          body: '이것은 테스트 알림입니다.',
          url: '/',
        },
      });
    }
  }, []);

  // 서비스워커 등록
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setState(prev => ({ ...prev, error: '서비스워커 등록에 실패했습니다.' }));
        return null;
      }
    }
    return null;
  }, []);

  // 푸시 알림 지원 여부 확인
  const checkSupport = useCallback(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setState(prev => ({ ...prev, isSupported }));
    return isSupported;
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
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
  }, [state.isSupported]);

  // 푸시 구독
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (state.permission !== 'granted') {
      setState(prev => ({ ...prev, error: '푸시 알림 권한이 필요합니다.' }));
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_APP_VAPID_PUBLIC_KEY
      });

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        subscription,
        error: null 
      }));

      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      setState(prev => ({ ...prev, error: '푸시 구독에 실패했습니다.' }));
      return false;
    }
  }, [state.permission]);

  // 푸시 구독 해제
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return false;
    }

    try {
      await state.subscription.unsubscribe();
      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        subscription: null,
        error: null 
      }));
      return true;
    } catch (error) {
      console.error('Unsubscription failed:', error);
      setState(prev => ({ ...prev, error: '구독 해제에 실패했습니다.' }));
      return false;
    }
  }, [state.subscription]);

  // 에러 클리어
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 초기화
  useEffect(() => {
    const initialize = async () => {
      // 지원 여부 확인
      checkSupport();
      
      if (state.isSupported) {
        // 서비스워커 등록
        await registerServiceWorker();
        
        // 현재 권한 상태 확인
        setState(prev => ({ ...prev, permission: Notification.permission }));
        
        // 기존 구독 확인
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            setState(prev => ({ 
              ...prev, 
              isSubscribed: true, 
              subscription 
            }));
          }
        } catch (error) {
          console.error('Failed to get existing subscription:', error);
        }
      }
    };

    initialize();
  }, [checkSupport, registerServiceWorker, state.isSupported]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
  };
};
