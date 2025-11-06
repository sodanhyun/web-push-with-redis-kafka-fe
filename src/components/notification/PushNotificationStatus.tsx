import React from 'react';

/**
 * @file PushNotificationStatus.tsx
 * @description 푸시 알림의 브라우저 지원, 권한, 구독 상태를 표시하는 컴포넌트입니다.
 *              `App.tsx`에서 분리되어 UI 로직의 응집도를 높였습니다.
 */

interface PushNotificationStatusProps {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

const PushNotificationStatus: React.FC<PushNotificationStatusProps> = ({
  isSupported,
  permission,
  isSubscribed,
}) => {
  return (
    <div className="status-grid">
      {/* 브라우저 지원 상태 표시 */}
      <div className="status-item">
        <span className="status-label">브라우저 지원:</span>
        <span className={`status-value ${isSupported ? 'supported' : 'not-supported'}`}>
          {isSupported ? '지원됨' : '지원 안됨'}
        </span>
      </div>
      {/* 알림 권한 상태 표시 */}
      <div className="status-item">
        <span className="status-label">권한 상태:</span>
        <span className={`status-value ${permission}`}>
          {permission === 'granted' ? '허용됨' :
           permission === 'denied' ? '거부됨' : '요청 필요'}
        </span>
      </div>
      {/* 푸시 구독 상태 표시 */}
      <div className="status-item">
        <span className="status-label">구독 상태:</span>
        <span className={`status-value ${isSubscribed ? 'subscribed' : 'not-subscribed'}`}>
          {isSubscribed ? '구독됨' : '구독 안됨'}
        </span>
      </div>
    </div>
  );
};

export default PushNotificationStatus;