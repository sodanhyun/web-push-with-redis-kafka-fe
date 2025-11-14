import { useEffect } from 'react';

/**
 * @file useServiceWorkerMessages.ts
 * @description 서비스 워커로부터 브로드캐스트 채널을 통해 메시지를 수신하고 처리하는 커스텀 훅입니다.
 *              `App.tsx`에서 서비스 워커 통신 로직을 분리하여 응집도를 높였습니다.
 */

/**
 * @hook useServiceWorkerMessages
 * @description 서비스 워커로부터 브로드캐스트 채널을 통해 메시지를 수신하고 처리하는 커스텀 훅입니다.
 *              이 훅은 `BroadcastChannel`을 생성하여 서비스 워커와 메인 스레드 간의 통신 채널을 설정합니다.
 *              서비스 워커에서 전송된 `NOTIFICATION_CLICKED`, `NOTIFICATION_DISPLAYED`, `NOTIFICATION_ERROR`
 *              메시지를 수신하고, 수신된 메시지 타입에 따라 `window` 객체에 커스텀 이벤트를 디스패치합니다.
 *              컴포넌트 언마운트 시 이벤트 리스너를 제거하고 브로드캐스트 채널을 닫아 메모리 누수를 방지합니다.
 */
const useServiceWorkerMessages = () => {
  useEffect(() => {
    // 'notification-channel'이라는 이름의 브로드캐스트 채널을 생성합니다.
    // 이 채널을 통해 서비스 워커와 메인 스레드가 통신합니다.
    const bc = new BroadcastChannel('notification-channel');

    /**
     * @function handleBroadcastMessage
     * @description BroadcastChannel을 통해 수신된 메시지를 처리하는 핸들러입니다.
     *              메시지 타입에 따라 적절한 커스텀 이벤트를 `window` 객체에 디스패치합니다.
     * @param {MessageEvent} event - BroadcastChannel 메시지 이벤트 객체
     */
    const handleBroadcastMessage = (event: MessageEvent) => {
      // 디버그 로그: console.log('[useServiceWorkerMessages] Message received from broadcast channel:', event.data);
      
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        // 디버그 로그: console.log('[useServiceWorkerMessages] NOTIFICATION_CLICKED message received.');
        const customEvent = new CustomEvent('notification-clicked', {
          detail: event.data,
        });
        // 디버그 로그: console.log('[useServiceWorkerMessages] Dispatching notification-clicked event:', customEvent);
        window.dispatchEvent(customEvent);
      }
      
      if (event.data && event.data.type === 'NOTIFICATION_DISPLAYED') {
        const customEvent = new CustomEvent('notification-displayed', {
          detail: event.data,
        });
        window.dispatchEvent(customEvent);
      }
      
      if (event.data && event.data.type === 'NOTIFICATION_ERROR') {
        console.error('[useServiceWorkerMessages] NOTIFICATION_ERROR message received:', event.data.error);
      }
    };

    // 브로드캐스트 채널에 메시지 리스너를 등록합니다.
    bc.addEventListener('message', handleBroadcastMessage);

    // 클린업 함수: 컴포넌트 언마운트 시 이벤트 리스너를 제거하고 채널을 닫습니다.
    return () => {
      bc.removeEventListener('message', handleBroadcastMessage);
      bc.close();
    };
  }, []); // 이 훅은 컴포넌트 마운트 시 한 번만 실행됩니다.
};

export default useServiceWorkerMessages;
