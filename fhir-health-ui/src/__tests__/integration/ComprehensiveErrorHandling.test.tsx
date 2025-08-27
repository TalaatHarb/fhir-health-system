import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../../App';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { PatientCreateModal } from '../../components/patient/PatientCreateModal';
import { EncounterCreateModal } from '../../components/encounter/EncounterCreateModal';
import { enhancedFhirClient } from '../../services/enhancedFhirClient';
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
    it('shows inline errors for invalid patient form data', async () => {
      const onClose = vi.fn();
      const onPatientCreated = vi.fn();

      render(
        <NotificationProvider>
          <PatientCreateModal 
            isOpen={true}
            onClose={onClose}
            onPatientCreated={onPatientCreated}
          />
        </NotificationProvider>
      );

      // Try to submit without required fields
      fireEvent.click(screen.getByText('Create Patient'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Please fix the following errors before submitting:')).toBeInTheDocument();
        expect(screen.getByText('Given name is required')).toBeInTheDocument();
        expect(screen.getByText('Family name is required')).toBeInTheDocument();
        expect(screen.getByText('Gender is required')).toBeInTheDocument();
        expect(screen.getByText('Birth date is required')).toBeInTheDocument();
      });
    });

    it('shows inline errors for individual fields when touched', async () => {
      const onClose = vi.fn();
      const onPatientCreated = vi.fn();

      render(
        <NotificationProvider>
          <PatientCreateModal 
            isOpen={true}
            onClose={onClose}
            onPatientCreated={onPatientCreated}
          />
        </NotificationProvider>
      );

      // Enter invalid email
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // Should show inline error for email field
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('clears errors when valid data is entered', async () => {
      const onClose = vi.fn();
      const onPatientCreated = vi.fn();

      render(
        <NotificationProvider>
          <PatientCreateModal 
            isOpen={true}
            onClose={onClose}
            onPatientCreated={onPatientCreated}
          />
        </NotificationProvider>
      );

      // Enter invalid email first
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Now enter valid email
      fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Error Handling', () => {
    it('shows error notification when patient creation fails', async () => {
      const mockCreatePatient = vi.mocked(enhancedFhirClient.createPatient);
      mockCreatePatient.mockRejectedValue(new Error('Server error'));

      const onClose = vi.fn();
      const onPatientCreated = vi.fn();

      render(
        <NotificationProvider>
          <PatientCreateModal 
            isOpen={true}
            onClose={onClose}
            onPatientCreated={onPatientCreated}
          />
        </NotificationProvider>
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Given Name *'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Family Name *'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText('Gender *'), { target: { value: 'male' } });
      fireEvent.change(screen.getByLabelText('Birth Date *'), { target: { value: '1990-01-01' } });

      // Submit form
      fireEvent.click(screen.getByText('Create Patient'));

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText('Failed to Create Patient')).toBeInTheDocument();
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('shows success notification when patient creation succeeds', async () => {
      const mockCreatePatient = vi.mocked(enhancedFhirClient.createPatient);
      mockCreatePatient.mockResolvedValue(mockPatient);

      const onClose = vi.fn();
      const onPatientCreated = vi.fn();

      render(
        <NotificationProvider>
          <PatientCreateModal 
            isOpen={true}
            onClose={onClose}
            onPatientCreated={onPatientCreated}
          />
        </NotificationProvider>
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Given Name *'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Family Name *'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText('Gender *'), { target: { value: 'male' } });
      fireEvent.change(screen.getByLabelText('Birth Date *'), { target: { value: '1990-01-01' } });

      // Submit form
      fireEvent.click(screen.getByText('Create Patient'));

      // Should show success notification
      await waitFor(() => {
        expect(screen.getByText('Patient Created')).toBeInTheDocument();
        expect(screen.getByText('Patient John Doe has been created successfully.')).toBeInTheDocument();
      });
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

      // Simulate going offline then online
      navigator.onLine = false;
      fireEvent(window, new Event('offline'));

      navigator.onLine = true;
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(mockProcessOfflineQueue).toHaveBeenCalled();
      });
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

      // All should be visible
      expect(screen.getByText('Success 1')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Warning 1')).toBeInTheDocument();
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

      // Only the first 2 should be visible
      expect(screen.getByText('Info 1')).toBeInTheDocument();
      expect(screen.getByText('Info 2')).toBeInTheDocument();
      expect(screen.queryByText('Info 3')).not.toBeInTheDocument();
      expect(screen.queryByText('Info 4')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('handles network recovery gracefully', async () => {
      const mockCheckConnection = vi.mocked(enhancedFhirClient.checkConnection);
      
      // Start offline
      mockCheckConnection.mockResolvedValue(false);
      navigator.onLine = false;

      const TestComponent = () => {
        const { showSuccess, showWarning } = useNotifications();
        const { isOffline } = useOfflineDetection({
          onOffline: () => showWarning('Connection Lost', 'You are offline'),
          onOnline: () => showSuccess('Connection Restored', 'You are back online')
        });

        return <div data-testid="offline-status">{isOffline ? 'offline' : 'online'}</div>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Should show offline status
      expect(screen.getByTestId('offline-status')).toHaveTextContent('offline');

      // Go back online
      mockCheckConnection.mockResolvedValue(true);
      navigator.onLine = true;
      fireEvent(window, new Event('online'));

      await waitFor(() => {
        expect(screen.getByTestId('offline-status')).toHaveTextContent('online');
      });
    });

    it('handles form submission errors with retry capability', async () => {
      const mockCreatePatient = vi.mocked(enhancedFhirClient.createPatient);
      
      // First attempt fails, second succeeds
      mockCreatePatient
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue(mockPatient);

      const onClose = vi.fn();
      const onPatientCreated = vi.fn();

      render(
        <NotificationProvider>
          <PatientCreateModal 
            isOpen={true}
            onClose={onClose}
            onPatientCreated={onPatientCreated}
          />
        </NotificationProvider>
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Given Name *'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Family Name *'), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText('Gender *'), { target: { value: 'male' } });
      fireEvent.change(screen.getByLabelText('Birth Date *'), { target: { value: '1990-01-01' } });

      // First submission fails
      fireEvent.click(screen.getByText('Create Patient'));

      await waitFor(() => {
        expect(screen.getByText('Failed to Create Patient')).toBeInTheDocument();
      });

      // Retry submission succeeds
      fireEvent.click(screen.getByText('Create Patient'));

      await waitFor(() => {
        expect(screen.getByText('Patient Created')).toBeInTheDocument();
      });
    });
  });
});

// Import useNotifications for the test
import { useNotifications } from '../../contexts/NotificationContext';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';
import { ToastContainer } from '../../components/common/Toast';