import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Toast, ToastContainer } from '../../../components/common/Toast';
import type { Notification } from '../../../types';

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const mockNotification: Notification = {
  id: 'test-1',
  type: 'success',
  title: 'Test Title',
  message: 'Test message',
  timestamp: new Date(),
  duration: 5000,
};

describe('Toast', () => {
  it('renders notification content correctly', () => {
    const onRemove = vi.fn();

    render(<Toast notification={mockNotification} onRemove={onRemove} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders correct icon for different notification types', () => {
    const onRemove = vi.fn();

    const { rerender } = render(
      <Toast notification={{ ...mockNotification, type: 'success' }} onRemove={onRemove} />
    );
    expect(screen.getByText('✓')).toBeInTheDocument();

    rerender(
      <Toast notification={{ ...mockNotification, type: 'error' }} onRemove={onRemove} />
    );
    expect(screen.getByText('✕')).toBeInTheDocument();

    rerender(
      <Toast notification={{ ...mockNotification, type: 'warning' }} onRemove={onRemove} />
    );
    expect(screen.getByText('⚠')).toBeInTheDocument();

    rerender(
      <Toast notification={{ ...mockNotification, type: 'info' }} onRemove={onRemove} />
    );
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('applies correct CSS classes for notification types', () => {
    const onRemove = vi.fn();

    render(<Toast notification={{ ...mockNotification, type: 'error' }} onRemove={onRemove} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast--error');
  });

  it('calls onRemove when close button is clicked', () => {
    const onRemove = vi.fn();

    render(<Toast notification={mockNotification} onRemove={onRemove} />);

    fireEvent.click(screen.getByLabelText('Close notification'));

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(onRemove).toHaveBeenCalledWith('test-1');
  });

  it('auto-removes after specified duration', async () => {
    const onRemove = vi.fn();

    render(<Toast notification={mockNotification} onRemove={onRemove} />);

    // Fast-forward time to trigger auto-removal
    vi.advanceTimersByTime(5000);

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(onRemove).toHaveBeenCalledWith('test-1');
  });

  it('renders action buttons when provided', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();
    const onRemove = vi.fn();

    const notificationWithActions: Notification = {
      ...mockNotification,
      actions: [
        { label: 'Action 1', action: action1, style: 'primary' },
        { label: 'Action 2', action: action2, style: 'secondary' },
      ],
    };

    render(<Toast notification={notificationWithActions} onRemove={onRemove} />);

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('calls action callback and removes toast when action is clicked', () => {
    const action1 = vi.fn();
    const onRemove = vi.fn();

    const notificationWithActions: Notification = {
      ...mockNotification,
      actions: [{ label: 'Action 1', action: action1 }],
    };

    render(<Toast notification={notificationWithActions} onRemove={onRemove} />);

    fireEvent.click(screen.getByText('Action 1'));

    expect(action1).toHaveBeenCalled();

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(onRemove).toHaveBeenCalledWith('test-1');
  });

  it('does not render message when not provided', () => {
    const onRemove = vi.fn();
    const notificationWithoutMessage: Notification = {
      ...mockNotification,
      message: undefined,
    };

    render(<Toast notification={notificationWithoutMessage} onRemove={onRemove} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });
});

describe('ToastContainer', () => {
  const notifications: Notification[] = [
    {
      id: 'toast-1',
      type: 'success',
      title: 'Success',
      message: 'Operation successful',
      timestamp: new Date(),
    },
    {
      id: 'toast-2',
      type: 'error',
      title: 'Error',
      message: 'Operation failed',
      timestamp: new Date(),
    },
  ];

  it('renders all notifications', () => {
    const onRemove = vi.fn();

    render(<ToastContainer notifications={notifications} onRemove={onRemove} />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders nothing when no notifications', () => {
    const onRemove = vi.fn();

    const { container } = render(<ToastContainer notifications={[]} onRemove={onRemove} />);

    expect(container.firstChild).toBeNull();
  });

  it('applies correct position class', () => {
    const onRemove = vi.fn();

    const { rerender } = render(
      <ToastContainer notifications={notifications} onRemove={onRemove} position="top-left" />
    );

    expect(screen.getByLabelText('Notifications')).toHaveClass('toast-container--top-left');

    rerender(
      <ToastContainer notifications={notifications} onRemove={onRemove} position="bottom-right" />
    );

    expect(screen.getByLabelText('Notifications')).toHaveClass('toast-container--bottom-right');
  });

  it('limits number of visible toasts', () => {
    const manyNotifications: Notification[] = Array.from({ length: 10 }, (_, i) => ({
      id: `toast-${i}`,
      type: 'info' as const,
      title: `Toast ${i}`,
      timestamp: new Date(),
    }));

    const onRemove = vi.fn();

    render(
      <ToastContainer 
        notifications={manyNotifications} 
        onRemove={onRemove} 
        maxToasts={3} 
      />
    );

    // Should only render first 3 toasts
    expect(screen.getByText('Toast 0')).toBeInTheDocument();
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.queryByText('Toast 3')).not.toBeInTheDocument();
  });

  it('passes onRemove callback to individual toasts', () => {
    const onRemove = vi.fn();

    render(<ToastContainer notifications={notifications} onRemove={onRemove} />);

    // Click close on first toast
    const closeButtons = screen.getAllByLabelText('Close notification');
    fireEvent.click(closeButtons[0]);

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(onRemove).toHaveBeenCalledWith('toast-1');
  });

  it('has proper accessibility attributes', () => {
    const onRemove = vi.fn();

    render(<ToastContainer notifications={notifications} onRemove={onRemove} />);

    const container = screen.getByLabelText('Notifications');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-label', 'Notifications');
  });
});