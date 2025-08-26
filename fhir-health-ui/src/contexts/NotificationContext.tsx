import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Notification, NotificationAction } from '../types';

interface NotificationState {
  notifications: Notification[];
}

type NotificationActionType =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Convenience methods for different notification types
  showSuccess: (title: string, message?: string, actions?: NotificationAction[]) => void;
  showError: (title: string, message?: string, actions?: NotificationAction[]) => void;
  showWarning: (title: string, message?: string, actions?: NotificationAction[]) => void;
  showInfo: (title: string, message?: string, actions?: NotificationAction[]) => void;
}

const initialState: NotificationState = {
  notifications: [],
};

function notificationReducer(state: NotificationState, action: NotificationActionType): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>): void => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  }, []);

  const removeNotification = useCallback((id: string): void => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearNotifications = useCallback((): void => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((title: string, message?: string, actions?: NotificationAction[]): void => {
    addNotification({
      type: 'success',
      title,
      message,
      actions,
      duration: 4000,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, actions?: NotificationAction[]): void => {
    addNotification({
      type: 'error',
      title,
      message,
      actions,
      duration: 8000, // Longer duration for errors
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, actions?: NotificationAction[]): void => {
    addNotification({
      type: 'warning',
      title,
      message,
      actions,
      duration: 6000,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, actions?: NotificationAction[]): void => {
    addNotification({
      type: 'info',
      title,
      message,
      actions,
      duration: 5000,
    });
  }, [addNotification]);

  const contextValue: NotificationContextValue = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}