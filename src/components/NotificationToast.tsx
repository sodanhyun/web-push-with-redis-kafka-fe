import React, { useState, useEffect } from 'react';
import './NotificationToast.css';

interface NotificationToastProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
  show?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

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

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

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

// 알림 컨테이너 컴포넌트
export const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      console.log('[NotificationToast.tsx] notification-clicked event received:', event);
      const customEvent = event as CustomEvent;
      const notificationData = customEvent.detail;

      if (notificationData) {
        console.log('[NotificationToast.tsx] Notification data:', notificationData);
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: notificationData.title || '알림',
          message: notificationData.body || '새로운 메시지가 있습니다.',
          type: 'info',
          timestamp: Date.now(),
        };
        setNotifications(prev => [...prev, newNotification]);
      }
    };
    const handleNotificationDisplayed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const notificationData = customEvent.detail;

      if (notificationData) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          title: notificationData.title || '알림',
          message: notificationData.body || '새로운 메시지가 있습니다.',
          type: 'info',
          timestamp: Date.now(),
        };
        setNotifications(prev => [...prev, newNotification]);
      }
    }
    window.addEventListener('notification-clicked', handleNotificationClick);
    window.addEventListener('notification-displayed', handleNotificationDisplayed);
    return () => {
      window.removeEventListener('notification-clicked', handleNotificationClick);
      window.removeEventListener('notification-displayed', handleNotificationDisplayed);
    };
  }, []);

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