import React, { useState, useEffect } from 'react';
import './NotificationToast.css';

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
 *              지정된 시간(duration) 후에 자동으로 사라지거나, 사용자가 닫기 버튼을 클릭하면 사라집니다.
 *              알림 타입(type)에 따라 다른 아이콘과 스타일을 적용합니다.
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  show = true,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  /**
   * @hook useEffect
   * @description `show` prop 또는 `duration` prop이 변경될 때 알림의 표시 로직을 처리합니다.
   *              `show`가 true일 때 알림을 표시하고, `duration` 후에 자동으로 닫히도록 타이머를 설정합니다.
   *              컴포넌트 언마운트 시 타이머를 클리어하여 메모리 누수를 방지합니다.
   */
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  /**
   * @function handleClose
   * @description 알림을 닫는 로직을 처리합니다.
   *              사라지는 애니메이션을 시작하고, 애니메이션 완료 후 알림을 DOM에서 제거합니다.
   *              `onClose` 콜백 함수가 있으면 호출합니다.
   */
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  /**
   * @function getIcon
   * @description 알림 타입에 따라 적절한 이모지 아이콘을 반환합니다.
   */
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`notification-toast ${type} ${isExiting ? 'exiting' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <div className="notification-title">{title}</div>
          <div className="notification-message">{message}</div>
        </div>
        <button 
          className="notification-close"
          onClick={handleClose}
          aria-label="알림 닫기"
        >
          ×
        </button>
      </div>
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
 *              `window` 객체에 디스패치된 커스텀 이벤트(`notification-clicked`, `notification-displayed`)를 수신하여
 *              새로운 알림을 생성하고 상태에 추가합니다.
 */
export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * @hook useEffect
   * @description `window` 객체에 커스텀 이벤트 리스너를 등록하여 서비스 워커로부터의 알림 이벤트를 처리합니다.
   *              `notification-clicked` 이벤트는 사용자가 시스템 알림을 클릭했을 때 발생하며,
   *              `notification-displayed` 이벤트는 시스템 알림이 성공적으로 표시되었을 때 발생합니다.
   *              수신된 알림 데이터를 기반으로 새로운 토스트 알림을 생성하여 `notifications` 상태에 추가합니다.
   *              컴포넌트 언마운트 시 이벤트 리스너를 제거하여 메모리 누수를 방지합니다.
   */
  useEffect(() => {
    const addNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      // 서비스 워커로부터 받은 데이터 구조에 맞게 `detail.notification`을 참조합니다.
      const notificationData = customEvent.detail?.notification;

      if (notificationData) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: notificationData.title || '알림',
          message: notificationData.body || '새로운 메시지가 있습니다.',
          type: 'info', // 필요에 따라 `notificationData`에서 타입을 지정할 수 있습니다.
          timestamp: Date.now(),
        };
        setNotifications(prev => [...prev, newNotification]);
      }
    };

    // 'push-received' 이벤트를 수신하여 토스트 알림을 표시합니다.
    window.addEventListener('push-received', addNotification);
    // 기존 이벤트 리스너들도 새로운 핸들러를 사용하도록 통일합니다.
    window.addEventListener('notification-clicked', addNotification);

    return () => {
      window.removeEventListener('push-received', addNotification);
      window.removeEventListener('notification-clicked', addNotification);
    };
  }, []);

  /**
   * @function removeNotification
   * @description 지정된 ID를 가진 알림을 목록에서 제거합니다.
   * @param {string} id - 제거할 알림의 고유 ID입니다.
   */
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};