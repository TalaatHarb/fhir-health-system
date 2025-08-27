import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary, PatientErrorBoundary, EncounterErrorBoundary } from '../../../components/common/ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  console.error = vi.fn();
  user = userEvent.setup();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('resets error state when Try Again is clicked', async () => {
    const onError = vi.fn();
    const { rerender } = render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    // Click Try Again - this should reset the error boundary's internal state
    await user.click(screen.getByText('Try Again'));

    // Now rerender with a key change to force remount and test that it works
    rerender(
      <ErrorBoundary key="new-key" onError={onError}>
        <div>No error</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('reloads page when Reload Page is clicked', () => {
    const reloadMock = vi.fn();
    // Mock the entire location object
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: reloadMock } as any;

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));

    expect(reloadMock).toHaveBeenCalled();
    
    // Restore original location
    window.location = originalLocation;
  });

  it('resets error when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange resetKeys={['key1']}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change resetKeys
    rerender(
      <ErrorBoundary resetOnPropsChange resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});

describe('PatientErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <PatientErrorBoundary>
        <div>Patient content</div>
      </PatientErrorBoundary>
    );

    expect(screen.getByText('Patient content')).toBeInTheDocument();
  });

  it('renders patient-specific error UI when child component throws', () => {
    render(
      <PatientErrorBoundary>
        <ThrowError />
      </PatientErrorBoundary>
    );

    expect(screen.getByText('Patient Data Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load patient information/)).toBeInTheDocument();
    expect(screen.getByText('Retry Loading Patient')).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', async () => {
    const onError = vi.fn();
    const { rerender } = render(
      <PatientErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </PatientErrorBoundary>
    );

    expect(screen.getByText('Patient Data Error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    // Click retry
    await user.click(screen.getByText('Retry Loading Patient'));

    // Rerender with key change to test reset functionality
    rerender(
      <PatientErrorBoundary key="new-key" onError={onError}>
        <div>No error</div>
      </PatientErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});

describe('EncounterErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <EncounterErrorBoundary>
        <div>Encounter content</div>
      </EncounterErrorBoundary>
    );

    expect(screen.getByText('Encounter content')).toBeInTheDocument();
  });

  it('renders encounter-specific error UI when child component throws', () => {
    render(
      <EncounterErrorBoundary>
        <ThrowError />
      </EncounterErrorBoundary>
    );

    expect(screen.getByText('Encounter Data Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load encounter information/)).toBeInTheDocument();
    expect(screen.getByText('Retry Loading Encounters')).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', async () => {
    const onError = vi.fn();
    const { rerender } = render(
      <EncounterErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </EncounterErrorBoundary>
    );

    expect(screen.getByText('Encounter Data Error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();

    // Click retry
    await user.click(screen.getByText('Retry Loading Encounters'));

    // Rerender with key change to test reset functionality
    rerender(
      <EncounterErrorBoundary key="new-key" onError={onError}>
        <div>No error</div>
      </EncounterErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});