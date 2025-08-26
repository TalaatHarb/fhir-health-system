import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorBoundary, PatientErrorBoundary, EncounterErrorBoundary } from '../../../components/common/ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
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

  it('resets error state when Try Again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('reloads page when Reload Page is clicked', () => {
    const originalReload = window.location.reload;
    window.location.reload = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));

    expect(window.location.reload).toHaveBeenCalled();

    window.location.reload = originalReload;
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

  it('resets error state when retry button is clicked', () => {
    const { rerender } = render(
      <PatientErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PatientErrorBoundary>
    );

    expect(screen.getByText('Patient Data Error')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Retry Loading Patient'));

    // Re-render with no error
    rerender(
      <PatientErrorBoundary>
        <ThrowError shouldThrow={false} />
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

  it('resets error state when retry button is clicked', () => {
    const { rerender } = render(
      <EncounterErrorBoundary>
        <ThrowError shouldThrow={true} />
      </EncounterErrorBoundary>
    );

    expect(screen.getByText('Encounter Data Error')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Retry Loading Encounters'));

    // Re-render with no error
    rerender(
      <EncounterErrorBoundary>
        <ThrowError shouldThrow={false} />
      </EncounterErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});