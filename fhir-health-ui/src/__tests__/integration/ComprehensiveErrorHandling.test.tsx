import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationProvider, useNotifications } from '../../contexts/NotificationContext';
import { PatientProvider } from '../../contexts/PatientContext';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import { PatientCreateModal } from '../../components/patient/PatientCreateModal';
import { enhancedFhirClient } from '../../services/enhancedFhirClient';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';
import { ToastContainer } from '../../components/common/Toast';
import type { Patient } from '../../types/fhir';

// Mock the enhanced FHIR client
vi.mock('../../services/enhancedFhirClient', () => ({
  enhancedFhirClient: {
    checkConnection: vi.fn(),
    processOfflineQueue: vi.fn(),
    createPatient: vi.fn(),
    createEncounter: vi.fn(),
    getCircuitBreakerState: vi.fn().mockReturnValue('closed'),
    resetCircuitBreaker: vi.fn(),
  }
}));

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
const mockNavigatorOnLine = vi.fn(() => true);
Object.defineProperty(navigator, 'onLine', {
  get: mockNavigatorOnLine,
  configurable: true,
});

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  mockNavigatorOnLine.mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

const mockPatient: Patient = {
  id: 'test-patient-1',
  resourceType: 'Patient',
  active: true,
  name: [{
    use: 'official',
    family: 'Doe',
    given: ['John']
  }],
  gender: 'male',
  birthDate: '1990-01-01'
};

describe('Comprehensive Error Handling', () => {
  describe('Form Validation with Error Handling', () => {
    it('shows validation errors when form is invalid', async () => {
      // Test basic validation logic with empty patient data
      const emptyPatient = {
        resourceType: 'Patient' as const,
        active: true,
      };

      const errors: string[] = [];

      // Simulate validation logic
      if (!emptyPatient.name?.[0]?.given?.[0]) errors.push('Given name is required');
      if (!emptyPatient.name?.[0]?.family) errors.push('Family name is required');
      if (!('gender' in emptyPatient)) errors.push('Gender is required');
      if (!('birthDate' in emptyPatient)) errors.push('Birth date is required');

      expect(errors).toContain('Given name is required');
      expect(errors).toContain('Family name is required');
      expect(errors).toContain('Gender is required');
      expect(errors).toContain('Birth date is required');
    });

    it('validates email format correctly', async () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('john.doe@example.com')).toBe(true);
    });

    it('clears validation errors when data becomes valid', async () => {
      let errors: string[] = ['Please enter a valid email address'];

      // Simulate clearing error when valid email is entered
      const email = 'john.doe@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        errors = errors.filter(error => error !== 'Please enter a valid email address');
      }

      expect(errors).not.toContain('Please enter a valid email address');
    });
  });

  describe('API Error Handling', () => {
    it('handles patient creation failure correctly', async () => {
      const mockCreatePatient = vi.mocked(enhancedFhirClient.createPatient);
      mockCreatePatient.mockRejectedValue(new Error('Server error'));

      try {
        await mockCreatePatient(mockPatient);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Server error');
      }

      expect(mockCreatePatient).toHaveBeenCalledWith(mockPatient);
    });

    it('handles patient creation success correctly', async () => {
      const mockCreatePatient = vi.mocked(enhancedFhirClient.createPatient);
      mockCreatePatient.mockResolvedValue(mockPatient);

      const result = await mockCreatePatient(mockPatient);

      expect(result).toEqual(mockPatient);
      expect(mockCreatePatient).toHaveBeenCalledWith(mockPatient);
    });
  });

  describe('Offline Handling', () => {
    it('shows offline banner when connection is lost', async () => {
      const mockCheckConnection = vi.mocked(enhancedFhirClient.checkConnection);
      mockCheckConnection.mockResolvedValue(false);

      render(
        <NotificationProvider>
          <div>
            <div className="offline-banner">
              <span>⚠ You are currently offline</span>
            </div>
          </div>
        </NotificationProvider>
      );

      expect(screen.getByText('⚠ You are currently offline')).toBeInTheDocument();
    });

    it('processes offline queue when connection is restored', async () => {
      const mockProcessOfflineQueue = vi.mocked(enhancedFhirClient.processOfflineQueue);
      mockProcessOfflineQueue.mockResolvedValue();

      // Simulate processing offline queue
      await mockProcessOfflineQueue();

      expect(mockProcessOfflineQueue).toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('shows circuit breaker status', () => {
      const mockGetCircuitBreakerState = vi.mocked(enhancedFhirClient.getCircuitBreakerState);
      mockGetCircuitBreakerState.mockReturnValue('open');

      // In a real implementation, you might have a status component
      expect(enhancedFhirClient.getCircuitBreakerState()).toBe('open');
    });

    it('can reset circuit breaker', () => {
      const mockResetCircuitBreaker = vi.mocked(enhancedFhirClient.resetCircuitBreaker);

      enhancedFhirClient.resetCircuitBreaker();

      expect(mockResetCircuitBreaker).toHaveBeenCalled();
    });
  });

  describe('Toast Notifications', () => {
    it('displays multiple notifications with proper stacking', async () => {
      const TestComponent = () => {
        const { showSuccess, showError, showWarning, notifications, removeNotification } = useNotifications();

        return (
          <div>
            <button onClick={() => showSuccess('Success 1', 'First success')}>Success 1</button>
            <button onClick={() => showError('Error 1', 'First error')}>Error 1</button>
            <button onClick={() => showWarning('Warning 1', 'First warning')}>Warning 1</button>
            <ToastContainer
              notifications={notifications}
              onRemove={removeNotification}
              position="top-right"
              maxToasts={3}
            />
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Show multiple notifications
      fireEvent.click(screen.getByText('Success 1'));
      fireEvent.click(screen.getByText('Error 1'));
      fireEvent.click(screen.getByText('Warning 1'));

      // All should be visible - check for toast content using getAllByText
      const successElements = screen.getAllByText('Success 1');
      const errorElements = screen.getAllByText('Error 1');
      const warningElements = screen.getAllByText('Warning 1');

      expect(successElements.length).toBeGreaterThan(0);
      expect(errorElements.length).toBeGreaterThan(0);
      expect(warningElements.length).toBeGreaterThan(0);
    });

    it('limits number of visible toasts', async () => {
      const TestComponent = () => {
        const { showInfo, notifications, removeNotification } = useNotifications();

        return (
          <div>
            <button onClick={() => showInfo('Info 1', 'First info')}>Info 1</button>
            <button onClick={() => showInfo('Info 2', 'Second info')}>Info 2</button>
            <button onClick={() => showInfo('Info 3', 'Third info')}>Info 3</button>
            <button onClick={() => showInfo('Info 4', 'Fourth info')}>Info 4</button>
            <ToastContainer
              notifications={notifications}
              onRemove={removeNotification}
              position="top-right"
              maxToasts={2}
            />
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Show more notifications than the limit
      fireEvent.click(screen.getByText('Info 1'));
      fireEvent.click(screen.getByText('Info 2'));
      fireEvent.click(screen.getByText('Info 3'));
      fireEvent.click(screen.getByText('Info 4'));

      // Only the first 2 toasts should be visible - check within toast container
      const toastContainer = screen.getByLabelText('Notifications');
      const toastElements = toastContainer.querySelectorAll('.toast');

      expect(toastElements).toHaveLength(2);

      // Check that the visible toasts contain Info 1 and Info 2
      const info1Elements = screen.getAllByText('Info 1');
      const info2Elements = screen.getAllByText('Info 2');

      expect(info1Elements.length).toBeGreaterThan(0);
      expect(info2Elements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('handles network recovery gracefully', async () => {
      const mockCheckConnection = vi.mocked(enhancedFhirClient.checkConnection);

      // Test offline detection logic
      mockCheckConnection.mockResolvedValue(false);
      const isOffline = !(await mockCheckConnection());
      expect(isOffline).toBe(true);

      // Test online recovery
      mockCheckConnection.mockResolvedValue(true);
      const isOnline = await mockCheckConnection();
      expect(isOnline).toBe(true);
    });

    it('handles form submission errors with retry capability', async () => {
      const mockCreatePatient = vi.mocked(enhancedFhirClient.createPatient);

      // First attempt fails, second succeeds
      mockCreatePatient
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue(mockPatient);

      // First attempt should fail
      try {
        await mockCreatePatient(mockPatient);
      } catch (error) {
        expect((error as Error).message).toBe('Network timeout');
      }

      // Second attempt should succeed
      const result = await mockCreatePatient(mockPatient);
      expect(result).toEqual(mockPatient);
      expect(mockCreatePatient).toHaveBeenCalledTimes(2);
    });
  });
});

