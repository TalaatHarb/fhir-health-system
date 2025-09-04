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
const mockNavigator = {
  onLine: true,
};
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  mockNavigator.onLine = true;
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

      // Check for error icon (there might be multiple ✕ symbols - one for icon, one for close button)
      const errorSymbols = screen.getAllByText('✕');
      expect(errorSymbols.length).toBeGreaterThan(0);
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
      await vi.advanceTimersByTimeAsync(5000);
      await vi.advanceTimersByTimeAsync(300); // Animation duration

      expect(screen.queryByText('Success')).not.toBeInTheDocument();
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
      await vi.advanceTimersByTimeAsync(300);

      expect(screen.queryByText('Success')).not.toBeInTheDocument();
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
      let shouldThrow = true;

      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error for error boundary');
        }
        return <div>No error</div>;
      };

      render(
        <ErrorBoundary resetKeys={[shouldThrow]} resetOnPropsChange={true}>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Change the error condition and click retry
      shouldThrow = false;
      fireEvent.click(screen.getByText('Try Again'));

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
      mockNavigator.onLine = false;

      render(<OfflineTestComponent />);

      expect(screen.getByTestId('online-status')).toHaveTextContent('offline');
      expect(screen.getByTestId('offline-status')).toHaveTextContent('offline');
    });

    it('responds to online/offline events', () => {
      mockNavigator.onLine = true;

      render(<OfflineTestComponent />);

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');

      // Simulate going offline
      mockNavigator.onLine = false;
      fireEvent(window, new Event('offline'));

      expect(screen.getByTestId('online-status')).toHaveTextContent('offline');

      // Simulate going back online
      mockNavigator.onLine = true;
      fireEvent(window, new Event('online'));

      expect(screen.getByTestId('online-status')).toHaveTextContent('online');
    });

    it('performs connectivity checks', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));

      render(<OfflineTestComponent />);

      fireEvent.click(screen.getByText('Recheck'));

      // Give some time for the async operation
      await vi.advanceTimersByTimeAsync(100);

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Retry Mechanism Integration', () => {
    it('retries failed operations', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      // Start the retry operation
      const resultPromise = withRetry(mockFn, {
        maxAttempts: 3,
        baseDelay: 100,
        retryCondition: () => true, // Always retry for this test
      });

      // Advance timers to handle delays
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;
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

      // Start the retry operation
      const resultPromise = withRetry(mockFn, {
        maxAttempts: 3,
        baseDelay: 100,
        retryCondition: () => true, // Always retry for this test
        onRetry,
      });

      // Advance timers to handle delays
      await vi.advanceTimersByTimeAsync(200);

      await resultPromise;
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
      await vi.advanceTimersByTimeAsync(1100);

      // Next execution should work and close circuit
      const successFn = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successFn);

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('Complete Error Handling Flow', () => {
    it('integrates notification system with error handling', async () => {
      const TestApp = () => {
        const { showError } = useNotifications();

        const handleError = () => {
          showError('Test Error', 'This is a test error message');
        };

        return (
          <div>
            <button onClick={handleError}>Trigger Error</button>
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestApp />
          <TestNotificationComponent />
        </NotificationProvider>
      );

      // Trigger error notification
      fireEvent.click(screen.getByText('Trigger Error'));

      // Should show error notification
      expect(screen.getByText('Test Error')).toBeInTheDocument();
      expect(screen.getByText('This is a test error message')).toBeInTheDocument();
    });

    it('integrates error boundary with component errors', async () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should trigger error boundary
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});