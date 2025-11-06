import { useState } from 'react';

/**
 * @file SubscribeButton.tsx
 * @description 푸시 알림 구독 관련 버튼 (권한 요청, 구독, 해지)을 렌더링하는 컴포넌트입니다.
 *              `App.tsx`에서 분리되어 푸시 알림 UI 로직의 응집도를 높였습니다.
 */

/**
 * @interface SubscribeButtonProps
 * @description SubscribeButton 컴포넌트의 props 타입을 정의합니다.
 */
interface SubscribeButtonProps {
  permission: NotificationPermission; // 알림 권한 상태 ('granted', 'denied', 'default')
  isSubscribed: boolean; // 푸시 알림 구독 여부
  requestPermission: () => Promise<boolean>; // 알림 권한 요청 함수
  subscribe: () => Promise<boolean>; // 푸시 알림 구독 함수
  unsubscribe: () => Promise<boolean>; // 푸시 알림 구독 해지 함수
}

/**
 * @function SubscribeButton
 * @description 푸시 알림 권한 요청, 구독, 해지 버튼을 렌더링하는 컴포넌트.
 *
 * - `permission` 상태에 따라 '권한 요청', '푸시 알림 구독', '구독 해제' 버튼을 조건부 렌더링합니다.
 * - 각 버튼 클릭 시 `usePushNotification` 훅에서 전달받은 해당 함수를 호출합니다.
 * - 로딩 상태를 관리하여 버튼 중복 클릭을 방지하고 사용자에게 피드백을 제공합니다.
 */
function SubscribeButton({
  permission,
  isSubscribed,
  requestPermission,
  subscribe,
  unsubscribe
}: SubscribeButtonProps) {  
  // 버튼의 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);

  /**
   * @async
   * @function handleRequestPermission
   * @description 알림 권한 요청 버튼 클릭 핸들러.
   * `requestPermission` 함수를 호출하여 사용자에게 알림 권한을 요청합니다.
   * 로딩 상태를 토글하여 중복 요청을 방지합니다.
   */
  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @async
   * @function handleSubscribe
   * @description 푸시 알림 구독 버튼 클릭 핸들러.
   * `subscribe` 함수를 호출하여 푸시 알림을 구독합니다.
   * 구독 성공 시 콘솔에 메시지를 로깅합니다.
   * 로딩 상태를 토글하여 중복 요청을 방지합니다.
   */
  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await subscribe();
      if (success) {
        // 구독 성공 시 서버에 토큰을 전송하는 로직은 usePushNotification 훅 내부 또는 App 컴포넌트의 useEffect에서 처리됩니다.
        console.log('푸시 알림 구독이 완료되었습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @async
   * @function handleUnsubscribe
   * @description 푸시 알림 구독 해지 버튼 클릭 핸들러.
   * `unsubscribe` 함수를 호출하여 푸시 알림 구독을 해지합니다.
   * 로딩 상태를 토글하여 중복 요청을 방지합니다.
   */
  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="action-buttons">
        {/* 알림 권한이 'granted'가 아닐 때만 권한 요청 버튼을 표시합니다. */}
        {permission !== 'granted' && (
          <button 
            onClick={handleRequestPermission}
            disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
            className="btn btn-primary"
          >
            {isLoading ? '요청 중...' : '권한 요청'}
          </button>
        )}

        {/* 알림 권한이 'granted'이고 아직 구독되지 않았을 때만 푸시 알림 구독 버튼을 표시합니다. */}
        {permission === 'granted' && !isSubscribed && (
          <button 
            onClick={handleSubscribe}
            disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
            className="btn btn-success"
          >
            {isLoading ? '구독 중...' : '푸시 알림 구독'}
          </button>
        )}

        {/* 푸시 알림이 구독된 상태일 때만 구독 해제 버튼을 표시합니다. */}
        {isSubscribed && (
          <button 
            onClick={handleUnsubscribe}
            disabled={isLoading} // 로딩 중일 때는 버튼 비활성화
            className="btn btn-danger"
          >
            {isLoading ? '해제 중...' : '구독 해제'}
          </button>
        )}
      </div>
    </>
  );
}

export default SubscribeButton;