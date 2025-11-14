import React from 'react';

/**
 * @file PushNotificationStatus.tsx
 * @description 푸시 알림의 브라우저 지원, 권한, 구독 상태를 표시하는 컴포넌트입니다.
 *              `App.tsx`에서 분리되어 UI 로직의 응집도를 높였습니다.
 */

/**
 * @interface PushNotificationStatusProps
 * @description PushNotificationStatus 컴포넌트의 props 타입을 정의합니다.
 */
interface PushNotificationStatusProps {
  isSupported: boolean;           // 브라우저가 푸시 알림을 지원하는지 여부
  permission: NotificationPermission; // 현재 알림 권한 상태 ('granted', 'denied', 'default')
  isSubscribed: boolean;          // 푸시 알림 구독 여부
}

/**
 * @function PushNotificationStatus
 * @description 푸시 알림의 브라우저 지원 여부, 현재 알림 권한 상태, 푸시 구독 상태를 시각적으로 표시하는 컴포넌트입니다.
 * @param {PushNotificationStatusProps} props - 컴포넌트에 전달되는 props
 */
const PushNotificationStatus: React.FC<PushNotificationStatusProps> = ({
  isSupported,
  permission,
  isSubscribed,
}) => {
  return (
    <div className="status-grid">
      {/* 브라우저 푸시 알림 지원 상태를 표시합니다. */}
      <div className="status-item">
        <span className="status-label">브라우저 지원:</span>
        <span className={`status-value ${isSupported ? 'supported' : 'not-supported'}`}>
          {isSupported ? '지원됨' : '지원 안됨'}
        </span>
      </div>
      {/* 알림 권한 상태를 표시합니다. */}
      <div className="status-item">
        <span className="status-label">권한 상태:</span>
        <span className={`status-value ${permission}`}>
          {permission === 'granted' ? '허용됨' :
           permission === 'denied' ? '거부됨' : '요청 필요'}
        </span>
      </div>
      {/* 푸시 구독 상태를 표시합니다. */}
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
