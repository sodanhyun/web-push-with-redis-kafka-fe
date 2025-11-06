import React, { useState, useEffect } from 'react';
import './NotificationToast.css'; // 토스트 알림의 스타일을 위한 CSS 파일을 임포트합니다.

/**
 * @interface NotificationToastProps
 * @description NotificationToast 컴포넌트의 props 타입을 정의합니다.
 */
interface NotificationToastProps {
  title: string; // 알림의 제목
  message: string; // 알림의 내용
  type?: 'info' | 'success' | 'warning' | 'error'; // 알림의 타입 (기본값: 'info')
  duration?: number; // 알림이 자동으로 사라지기까지의 시간 (밀리초), 기본값: 5000ms
  onClose?: () => void; // 알림이 닫힐 때 호출될 콜백 함수
  show?: boolean; // 알림 표시 여부를 제어하는 플래그, 기본값: true
}

/**
 * @interface Notification
 * @description NotificationContainer에서 관리할 개별 알림 객체의 타입을 정의합니다.
 */
interface Notification {
  id: string; // 알림의 고유 ID
  title: string; // 알림의 제목
  message: string; // 알림의 내용
  type: 'info' | 'success' | 'warning' | 'error'; // 알림의 타입
  timestamp: number; // 알림이 생성된 시간 (타임스탬프)
}

/**
 * @function NotificationToast
 * @description 개별 토스트 알림을 렌더링하는 React 함수형 컴포넌트입니다.
 *
 * - 지정된 시간(duration) 후에 자동으로 사라지거나, 사용자가 닫기 버튼을 클릭하면 사라집니다.
 * - 알림 타입(type)에 따라 다른 아이콘과 스타일을 적용합니다.
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  show = true,
}) => {
  // 알림의 현재 가시성 상태를 관리합니다.
  const [isVisible, setIsVisible] = useState(show);
  // 알림이 사라지는 애니메이션 상태를 관리합니다.
  const [isExiting, setIsExiting] = useState(false);

  /**
   * @useEffect
   * @description `show` prop 또는 `duration` prop이 변경될 때 알림의 표시 로직을 처리합니다.
   *
   * - `show`가 true일 때 알림을 표시하고, `duration` 후에 자동으로 닫히도록 타이머를 설정합니다.
   * - 컴포넌트 언마운트 시 타이머를 클리어하여 메모리 누수를 방지합니다.
   */
  useEffect(() => {
    if (show) {
      setIsVisible(true); // 알림을 보이도록 설정
      setIsExiting(false); // 사라지는 애니메이션 상태 초기화
      
      // 지정된 시간 후에 알림을 자동으로 닫는 타이머를 설정합니다.
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      // 컴포넌트 언마운트 시 타이머를 정리합니다.
      return () => clearTimeout(timer);
    }
  }, [show, duration]); // `show` 또는 `duration`이 변경될 때마다 이 효과를 재실행합니다.

  /**
   * @function handleClose
   * @description 알림을 닫는 로직을 처리합니다.
   *
   * - 사라지는 애니메이션을 시작하고, 애니메이션 완료 후 알림을 DOM에서 제거합니다.
   * - `onClose` 콜백 함수가 있으면 호출합니다.
   */
  const handleClose = () => {
    setIsExiting(true); // 사라지는 애니메이션 시작
    // 애니메이션 지속 시간 후에 알림을 완전히 숨기고 `onClose` 콜백을 호출합니다.
    setTimeout(() => {
      setIsVisible(false); // 알림을 숨김
      onClose?.(); // `onClose` 콜백이 있으면 호출
    }, 300); // CSS 애니메이션 지속 시간과 일치하도록 설정
  };

  // `isVisible`이 false이면 아무것도 렌더링하지 않습니다.
  if (!isVisible) return null;

  /**
   * @function getIcon
   * @description 알림 타입에 따라 적절한 이모지 아이콘을 반환합니다.
   */
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'; // 성공 알림 아이콘
      case 'warning':
        return '⚠️'; // 경고 알림 아이콘
      case 'error':
        return '❌'; // 에러 알림 아이콘
      default:
        return 'ℹ️'; // 정보 알림 아이콘 (기본값)
    }
  };

  return (
    // 알림 컨테이너 div, 타입과 사라지는 애니메이션 상태에 따라 클래스가 적용됩니다.
    <div className={`notification-toast ${type} ${isExiting ? 'exiting' : ''}`}>
      <div className="notification-content">
        {/* 알림 타입에 따른 아이콘 */}
        <div className="notification-icon">
          {getIcon()}
        </div>
        {/* 알림 제목과 메시지 */}
        <div className="notification-text">
          <div className="notification-title">{title}</div>
          <div className="notification-message">{message}</div>
        </div>
        {/* 알림 닫기 버튼 */}
        <button 
          className="notification-close"
          onClick={handleClose}
          aria-label="알림 닫기"
        >
          ×
        </button>
      </div>
      {/* 알림 자동 닫힘 진행률 표시 바 */}
      <div className="notification-progress">
        <div 
          className="notification-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

/**
 * @function NotificationContainer
 * @description 여러 NotificationToast 컴포넌트를 관리하고 표시하는 컨테이너 컴포넌트입니다.
 *
 * - `window` 객체에 디스패치된 커스텀 이벤트(`notification-clicked`, `notification-displayed`)를 수신하여
 *   새로운 알림을 생성하고 상태에 추가합니다.
 * - 각 알림은 고유한 ID를 가지며, 닫히면 상태에서 제거됩니다.
 */
export const NotificationContainer: React.FC = () => {
  // 현재 활성화된 알림 목록을 관리하는 상태입니다.
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * @useEffect
   * @description `window` 객체에 커스텀 이벤트 리스너를 등록하여 서비스 워커로부터의 알림 이벤트를 처리합니다.
   *
   * - `notification-clicked`: 사용자가 시스템 알림을 클릭했을 때 발생합니다.
   * - `notification-displayed`: 시스템 알림이 성공적으로 표시되었을 때 발생합니다.
   * - 수신된 알림 데이터를 기반으로 새로운 토스트 알림을 생성하여 `notifications` 상태에 추가합니다.
   * - 컴포넌트 언마운트 시 이벤트 리스너를 제거하여 메모리 누수를 방지합니다.
   */
  useEffect(() => {
    // 사용자가 시스템 알림을 클릭했을 때 발생하는 이벤트를 처리합니다.
    const handleNotificationClick = (event: Event) => {
      console.log('[NotificationToast.tsx] notification-clicked event received:', event);
      const customEvent = event as CustomEvent; // CustomEvent 타입으로 캐스팅
      const notificationData = customEvent.detail; // 이벤트 상세 정보에서 알림 데이터 추출

      if (notificationData) {
        console.log('[NotificationToast.tsx] Notification data:', notificationData);
        // 새로운 토스트 알림 객체를 생성합니다.
        const newNotification: Notification = {
          id: Date.now().toString(), // 고유 ID 생성
          title: notificationData.title || '알림', // 알림 제목 (데이터 없으면 기본값)
          message: notificationData.body || '새로운 메시지가 있습니다.', // 알림 내용 (데이터 없으면 기본값)
          type: 'info', // 기본 타입은 'info'
          timestamp: Date.now(), // 현재 타임스탬프
        };
        // 기존 알림 목록에 새 알림을 추가합니다.
        setNotifications(prev => [...prev, newNotification]);
      }
    };

    // 시스템 알림이 성공적으로 표시되었을 때 발생하는 이벤트를 처리합니다.
    const handleNotificationDisplayed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notificationData = customEvent.detail;

      if (notificationData) {
        console.log('[NotificationToast.tsx] Notification data:', notificationData);
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: notificationData.notification.title || '알림', // 서비스 워커에서 보낸 notification 객체에서 title 추출
          message: notificationData.notification.body || '새로운 메시지가 있습니다.', // 서비스 워커에서 보낸 notification 객체에서 body 추출
          type: 'info',
          timestamp: Date.now(),
        };
        setNotifications(prev => [...prev, newNotification]);
      }
    };

    // `window` 객체에 커스텀 이벤트 리스너를 등록합니다.
    window.addEventListener('notification-clicked', handleNotificationClick);
    window.addEventListener('notification-displayed', handleNotificationDisplayed);

    // 컴포넌트 언마운트 시 이벤트 리스너를 제거하여 메모리 누수를 방지합니다.
    return () => {
      window.removeEventListener('notification-clicked', handleNotificationClick);
      window.removeEventListener('notification-displayed', handleNotificationDisplayed);
    };
  }, []); // 빈 의존성 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미합니다.

  /**
   * @function removeNotification
   * @description 지정된 ID를 가진 알림을 목록에서 제거합니다.
   *
   * @param {string} id - 제거할 알림의 고유 ID입니다.
   */
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    // 모든 토스트 알림이 렌더링될 컨테이너 div
    <div className="notification-container">
      {/* `notifications` 상태에 있는 각 알림 객체를 NotificationToast 컴포넌트로 매핑하여 렌더링합니다. */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id} // React 리스트 렌더링을 위한 고유 키
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)} // 알림이 닫힐 때 해당 알림을 목록에서 제거
        />
      ))}
    </div>
  );
};
