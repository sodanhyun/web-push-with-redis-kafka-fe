import { useEffect } from 'react';

/**
 * @file useServiceWorkerMessages.ts
 * @description 서비스 워커로부터 브로드캐스트 채널을 통해 메시지를 수신하고 처리하는 커스텀 훅입니다.
 *              `App.tsx`에서 서비스 워커 통신 로직을 분리하여 응집도를 높였습니다.
 */

/**
 * @function useServiceWorkerMessages
 * @description 서비스 워커로부터 브로드캐스트 채널을 통해 메시지를 수신하고 처리하는 커스텀 훅입니다.
 *
 * - `BroadcastChannel`을 생성하여 서비스 워커와 메인 스레드 간의 통신 채널을 설정합니다.
 * - 서비스 워커에서 전송된 `NOTIFICATION_CLICKED`, `NOTIFICATION_DISPLAYED`, `NOTIFICATION_ERROR` 메시지를 수신합니다.
 * - 수신된 메시지 타입에 따라 `window` 객체에 커스텀 이벤트를 디스패치합니다.
 *   - `notification-clicked`: 사용자가 알림을 클릭했을 때 발생합니다.
 *   - `notification-displayed`: 알림이 성공적으로 표시되었을 때 발생합니다.
 * - 컴포넌트 언마운트 시 이벤트 리스너를 제거하고 브로드캐스트 채널을 닫습니다.
 */
const useServiceWorkerMessages = () => {
  useEffect(() => {
    // 'notification-channel'이라는 이름의 브로드캐스트 채널을 생성합니다.
    // 이 채널을 통해 서비스 워커와 메인 스레드가 통신합니다.
    const bc = new BroadcastChannel('notification-channel');

    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('[useServiceWorkerMessages] Message received from broadcast channel:', event.data);
      // 서비스 워커로부터 알림 클릭 이벤트가 발생했음을 알리는 메시지를 수신합니다.
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        console.log('[useServiceWorkerMessages] NOTIFICATION_CLICKED message received.');
        // `notification-clicked`라는 커스텀 이벤트를 생성하여 window 객체에 디스패치합니다.
        // 이 이벤트를 통해 다른 컴포넌트(예: NotificationToast)에서 알림 클릭을 감지하고 처리할 수 있습니다.
        const customEvent = new CustomEvent('notification-clicked', {
          detail: event.data, // 서비스 워커로부터 받은 알림 데이터를 이벤트 상세 정보로 전달합니다.
        });
        console.log('[useServiceWorkerMessages] Dispatching notification-clicked event:', customEvent);
        window.dispatchEvent(customEvent);
      }
      // 서비스 워커로부터 알림이 성공적으로 표시되었음을 알리는 메시지를 수신합니다.
      if (event.data && event.data.type === 'NOTIFICATION_DISPLAYED') {
        // `notification-displayed`라는 커스텀 이벤트를 생성하여 window 객체에 디스패치합니다。
        const customEvent = new CustomEvent('notification-displayed', {
          detail: event.data, // 서비스 워커로부터 받은 알림 데이터를 이벤트 상세 정보로 전달합니다.
        });
        window.dispatchEvent(customEvent);
      }
      // 서비스 워커로부터 알림 표시 중 에러가 발생했음을 알리는 메시지를 수신합니다.
      if (event.data && event.data.type === 'NOTIFICATION_ERROR') {
        console.error('[useServiceWorkerMessages] NOTIFICATION_ERROR message received:', event.data.error);
        // 에러 처리 로직을 추가할 수 있습니다. (예: 사용자에게 알림)
      }
    };

    // 브로드캐스트 채널에 메시지 리스너를 등록합니다.
    bc.addEventListener('message', handleBroadcastMessage);

    // 컴포넌트 언마운트 시 이벤트 리스너를 제거하고 채널을 닫아 메모리 누수를 방지합니다.
    return () => {
      bc.removeEventListener('message', handleBroadcastMessage);
      bc.close();
    };
  }, []); // 빈 의존성 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미합니다.
};

export default useServiceWorkerMessages;