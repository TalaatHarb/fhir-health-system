import React, { useEffect, useState } from 'react';
import type { Notification, NotificationAction } from '../../types';
import './Toast.css';

interface ToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

/**
 * Individual Toast Component
 */
export function Toast({ notification, onRemove }: ToastProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-remove after duration
    const duration = notification.duration || 5000;
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.duration]);

  const handleRemove = (): void => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Match CSS transition duration
  };

  const handleActionClick = (action: NotificationAction): void => {
    action.action();
    handleRemove();
  };

  const getIcon = (): string => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div 
      className={`toast toast--${notification.type} ${isVisible ? 'toast--visible' : ''} ${isRemoving ? 'toast--removing' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__icon">
        {getIcon()}
      </div>
      
      <div className="toast__content">
        <div className="toast__title">{notification.title}</div>
        {notification.message && (
          <div className="toast__message">{notification.message}</div>
        )}
        
        {notification.actions && notification.actions.length > 0 && (
          <div className="toast__actions">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className={`toast__action toast__action--${action.style || 'primary'}`}
                onClick={() => handleActionClick(action)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button
        className="toast__close"
        onClick={handleRemove}
        aria-label="Close notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

/**
 * Toast Container Component
 */
export function ToastContainer({ 
  notifications, 
  onRemove, 
  position = 'top-right',
  maxToasts = 5 
}: ToastContainerProps): React.JSX.Element {
  // Limit the number of visible toasts
  const visibleNotifications = notifications.slice(0, maxToasts);

  if (visibleNotifications.length === 0) {
    return <></>;
  }

  return (
    <div 
      className={`toast-container toast-container--${position}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleNotifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}