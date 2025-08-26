import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { ToastContainer } from '../../components/common/Toast';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';
import { withRetry, CircuitBreaker } from '../../utils/retryMechanism';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  navigator.onLine = true;
});

afterEach(() => {
  vi.useRealTimers();
});

// Test component that uses notifications
const TestNotificationComponent = () => {
  const { showSuccess, showError, showWarning, showInfo, notifications, removeNotification } = useNotifications();

  return (
    <div>
      <button onClick={() => showSuccess('Success', 'Operation completed')}>
        Show Success
      </button>
      <button onClick={() => showError('Error', 'Operation failed')}>
        Show Error
      </button>
      <button onClick={() => showWarning('Warning', 'Be careful')}>
        Show Warning
      </button>
      <button onClick={() => showInfo('Info', 'Just so you know')}>
        Show Info
      </button>
      <ToastContainer 
        notifications={notifications} 
        onRemove={removeNotification}
        position="top-right"
      />
    </div>
  );
};

// Test component that throws errors
const ErrorThrowingComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>No error</div>;
};

// Test component for offline detection
const OfflineTestComponent = () => {
  const { isOnline, isOffline, recheckConnectivity } = useOfflineDetection({
    checkInterval: 1000,
  });

  return (
    <div>
      <div data-testid="online-status">{isOnline ? 'online' : 'offline'}</div>
      <div data-testid="offline-status">{isOffline ? 'offline' : 'online'}</div>
      <button onClick={recheckConnectivity}>Recheck</button>
    </div>
  );
};

describe('Error Handling Integration', () => {
  describe('Notification System', () => {
    it('displays success notifications', async () => {
      render(
        <NotificationProvider>
          <TestNotificationComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('displays error notifications', async () => {
      render(
        <NotificationProvider>
          <TestNotificationComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('displays warning notifications', async () => {
      render(
        <NotificationProvider>
          <TestNotificationComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Be careful')).toBeInTheDocument();
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('displays info notifications', async () => {
      render(
        <NotificationProvider>
          <TestNotificationComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Just so you know')).toBeInTheDocument();
      expect(screen.getByText('ℹ')).toBeInTheDocument();
    });

    it('auto-removes notifications after duration', async () => {
      render(
        <NotificationProvider>
          <TestNotificationComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();

      // Fast-forward past the auto-remove duration
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(300); // Animation duration

      await waitFor(() => {
        expect(screen.queryByText('Success')).not.toBeInTheDocument();
      });
    });

    it('removes notifications when close button is clicked', async () => {
      render(
        <NotificationProvider>
          <TestNotificationComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('Show Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Close notification'));

      // Wait for animation
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.queryByText('Success')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    // Suppress console.error for error boundary tests
    const originalConsoleError = console.error;
    beforeEach(() => {
      console.error = vi.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('catches and displays errors', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    });

    it('recovers from errors when retry is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('calls custom error handler', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Offline Detection Integration', () => {
    it('detects online status', () => {
      navigator.onLine = true;

      render(<OfflineTestComponent />);

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');
      expect(screen.getByTestId('offline-status')).toHaveTextContent('online');
    });

    it('detects offline status', () => {
      navigator.onLine = false;

      render(<OfflineTestComponent />);

      expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
      expect(screen.getByTestId('offline-status')).toHaveTextContent('offline');
    });

    it('responds to online/offline events', () => {
      navigator.onLine = true;

      render(<OfflineTestComponent />);

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');

      // Simulate going offline
      navigator.onLine = false;
      fireEvent(window, new Event('offline'));

      expect(screen.getByTestId('online-status')).toHaveTextContent('offline');

      // Simulate going back online
      navigator.onLine = true;
      fireEvent(window, new Event('online'));

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');
    });

    it('performs connectivity checks', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));

      render(<OfflineTestComponent />);

      fireEvent.click(screen.getByText('Recheck'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Retry Mechanism Integration', () => {
    it('retries failed operations', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxAttempts: 3,
        baseDelay: 100,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('respects retry conditions', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Validation error'));

      await expect(withRetry(mockFn, {
        maxAttempts: 3,
        retryCondition: () => false, // Never retry
      })).rejects.toThrow('Validation error');

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('calls retry callback', async () => {
      const onRetry = vi.fn();
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      await withRetry(mockFn, {
        maxAttempts: 3,
        baseDelay: 100,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('opens circuit after failure threshold', async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000);
      const failFn = vi.fn().mockRejectedValue(new Error('Service error'));

      // First failure
      await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('closed');

      // Second failure - should open circuit
      await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('open');

      // Third attempt should be rejected immediately
      const successFn = vi.fn().mockResolvedValue('success');
      await expect(circuitBreaker.execute(successFn)).rejects.toThrow('Circuit breaker is open');
      expect(successFn).not.toHaveBeenCalled();
    });

    it('transitions to half-open after recovery timeout', async () => {
      const circuitBreaker = new CircuitBreaker(1, 1000);
      const failFn = vi.fn().mockRejectedValue(new Error('Service error'));

      // Open circuit
      await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('open');

      // Fast-forward past recovery timeout
      vi.advanceTimersByTime(1100);

      // Next execution should work and close circuit
      const successFn = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successFn);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('Complete Error Handling Flow', () => {
    it('integrates all error handling components', async () => {
      const TestApp = () => {
        const { showError } = useNotifications();
        const [hasError, setHasError] = React.useState(false);

        const handleError = () => {
          showError('Test Error', 'This is a test error message');
          setHasError(true);
        };

        return (
          <div>
            <button onClick={handleError}>Trigger Error</button>
            <ErrorThrowingComponent shouldThrow={hasError} />
          </div>
        );
      };

      const { container } = render(
        <ErrorBoundary>
          <NotificationProvider>
            <TestApp />
            <TestNotificationComponent />
          </NotificationProvider>
        </ErrorBoundary>
      );

      // Trigger error notification
      fireEvent.click(screen.getByText('Trigger Error'));

      // Should show error notification
      expect(screen.getByText('Test Error')).toBeInTheDocument();
      expect(screen.getByText('This is a test error message')).toBeInTheDocument();

      // Should also trigger error boundary
      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });
  });
});