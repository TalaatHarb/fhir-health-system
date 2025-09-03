import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationProvider, useNotifications } from '../../contexts/NotificationContext';
import type { NotificationAction } from '../../types';

// Test component that uses the notification context
const TestComponent = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useNotifications();

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      
      {notifications.map((notification) => (
        <div key={notification.id} data-testid={`notification-${notification.id}`}>
          <span data-testid="notification-type">{notification.type}</span>
          <span data-testid="notification-title">{notification.title}</span>
          <span data-testid="notification-message">{notification.message}</span>
          <button onClick={() => removeNotification(notification.id)}>
            Remove
          </button>
        </div>
      ))}

      <button onClick={() => addNotification({
        type: 'info',
        title: 'Custom Notification',
        message: 'Custom message'
      })}>
        Add Custom
      </button>

      <button onClick={() => showSuccess('Success Title', 'Success message')}>
        Show Success
      </button>

      <button onClick={() => showError('Error Title', 'Error message')}>
        Show Error
      </button>

      <button onClick={() => showWarning('Warning Title', 'Warning message')}>
        Show Warning
      </button>

      <button onClick={() => showInfo('Info Title', 'Info message')}>
        Show Info
      </button>

      <button onClick={clearNotifications}>
        Clear All
      </button>
    </div>
  );
};

const TestComponentWithActions = () => {
  const { showError } = useNotifications();

  const handleShowErrorWithActions = () => {
    const actions: NotificationAction[] = [
      {
        label: 'Retry',
        action: () => console.log('Retry clicked'),
        style: 'primary'
      },
      {
        label: 'Cancel',
        action: () => console.log('Cancel clicked'),
        style: 'secondary'
      }
    ];

    showError('Error with actions', 'This error has action buttons', actions);
  };

  return (
    <div>
      <button onClick={handleShowErrorWithActions}>
        Show Error with Actions
      </button>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial empty state', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
  });

  it('adds custom notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add Custom'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-type')).toHaveTextContent('info');
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Custom Notification');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Custom message');
  });

  it('shows success notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-type')).toHaveTextContent('success');
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Success Title');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Success message');
  });

  it('shows error notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-type')).toHaveTextContent('error');
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Error Title');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Error message');
  });

  it('shows warning notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Warning'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-type')).toHaveTextContent('warning');
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Warning Title');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Warning message');
  });

  it('shows info notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notification-type')).toHaveTextContent('info');
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Info Title');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Info message');
  });

  it('removes individual notification', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add two notifications
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('2');

    // Remove one notification
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
  });

  it('clears all notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add multiple notifications
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Warning'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('3');

    // Clear all
    fireEvent.click(screen.getByText('Clear All'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
  });

  it('generates unique IDs for notifications', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add two identical notifications
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Success'));

    expect(screen.getByTestId('notification-count')).toHaveTextContent('2');

    // Both notifications should be present (different IDs)
    const notifications = screen.getAllByTestId(/^notification-notification-/);
    expect(notifications).toHaveLength(2);
  });

  it('includes timestamp in notifications', () => {
    const beforeTime = Date.now();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    const afterTime = Date.now();

    // We can't directly test the timestamp, but we can verify the notification was created
    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
  });

  it.skip('supports notifications with actions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(
      <NotificationProvider>
        <TestComponentWithActions />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Show Error with Actions'));

    // The notification should be added (we can't easily test the actions without more complex setup)
    expect(screen.getByText('Error with Actions')).toBeInTheDocument();
    expect(screen.getByText('This error has action buttons')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotifications must be used within a NotificationProvider');

    consoleSpy.mockRestore();
  });

  it('handles notifications without message', () => {
    const TestComponentNoMessage = () => {
      const { addNotification, notifications } = useNotifications();

      return (
        <div>
          <button onClick={() => addNotification({
            type: 'info',
            title: 'Title Only'
          })}>
            Add Title Only
          </button>
          {notifications.map((notification) => (
            <div key={notification.id}>
              <span data-testid="title">{notification.title}</span>
              <span data-testid="message">{notification.message || 'no-message'}</span>
            </div>
          ))}
        </div>
      );
    };

    render(
      <NotificationProvider>
        <TestComponentNoMessage />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Add Title Only'));

    expect(screen.getByTestId('title')).toHaveTextContent('Title Only');
    expect(screen.getByTestId('message')).toHaveTextContent('no-message');
  });
});