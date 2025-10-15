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
    // 서비스워커에서 메시지 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_RECEIVED') {
        const notification: Notification = {
          id: Date.now().toString(),
          title: event.data.title || '알림',
          message: event.data.message || '새로운 메시지가 있습니다.',
          type: event.data.notificationType || event.data.type || 'info',
          timestamp: Date.now(),
        };
        
        setNotifications(prev => [...prev, notification]);
      }
    };

    // 브라우저 알림 클릭 이벤트
    const handleNotificationClick = () => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: '알림 클릭',
        message: '브라우저 알림을 클릭했습니다.',
        type: 'info',
        timestamp: Date.now(),
      };
      
      setNotifications(prev => [...prev, notification]);
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('notificationclick', handleNotificationClick);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('notificationclick', handleNotificationClick);
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

// 푸시 알림 설정 컴포넌트
interface PushNotificationSettingsProps {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  onRequestPermission: () => Promise<boolean>;
  onSubscribe: () => Promise<boolean>;
  onUnsubscribe: () => Promise<boolean>;
  error: string | null;
  onClearError: () => void;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
  isSupported,
  permission,
  isSubscribed,
  onRequestPermission,
  onSubscribe,
  onUnsubscribe,
  error,
  onClearError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await onRequestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await onSubscribe();
      if (success) {
        // 구독 성공 시 토큰을 서버로 전송하는 로직은 Hook에서 처리
        console.log('푸시 알림 구독이 완료되었습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await onUnsubscribe();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="push-notification-settings">
        <h3>푸시 알림</h3>
        <p className="error-message">
          이 브라우저는 푸시 알림을 지원하지 않습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="push-notification-settings">
      <h3>푸시 알림 설정</h3>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={onClearError} className="clear-error-btn">
            ×
          </button>
        </div>
      )}

      <div className="permission-status">
        <strong>권한 상태:</strong> 
        <span className={`status ${permission}`}>
          {permission === 'granted' ? '허용됨' : 
           permission === 'denied' ? '거부됨' : '요청 필요'}
        </span>
      </div>

      <div className="subscription-status">
        <strong>구독 상태:</strong> 
        <span className={`status ${isSubscribed ? 'subscribed' : 'not-subscribed'}`}>
          {isSubscribed ? '구독됨' : '구독 안됨'}
        </span>
      </div>

      <div className="action-buttons">
        {permission !== 'granted' && (
          <button 
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? '요청 중...' : '권한 요청'}
          </button>
        )}

        {permission === 'granted' && !isSubscribed && (
          <button 
            onClick={handleSubscribe}
            disabled={isLoading}
            className="btn btn-success"
          >
            {isLoading ? '구독 중...' : '푸시 알림 구독'}
          </button>
        )}

        {isSubscribed && (
          <button 
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? '해제 중...' : '구독 해제'}
          </button>
        )}
      </div>
    </div>
  );
};
