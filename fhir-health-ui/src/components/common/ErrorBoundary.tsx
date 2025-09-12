import React, { Component, ErrorInfo, ReactNode } from 'react';
import type { BaseComponentProps } from '../../types';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps extends BaseComponentProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetKeys change
    if (this.props.resetOnPropsChange && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey
      );

      if (hasResetKeyChanged && this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = (): void => {
    this.resetErrorBoundary();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details (Development)</summary>
                <pre className="error-boundary__stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary__actions">
              <button 
                className="error-boundary__retry-btn"
                onClick={this.handleRetry}
                type="button"
              >
                Try Again
              </button>
              <button 
                className="error-boundary__reload-btn"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-specific Error Boundary for Patient components
 */
export class PatientErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('PatientErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="patient-error-boundary">
          <div className="patient-error-boundary__content">
            <h3>Patient Data Error</h3>
            <p>Unable to load patient information. This might be due to a network issue or server problem.</p>
            <button 
              onClick={this.resetErrorBoundary}
              className="patient-error-boundary__retry-btn"
              type="button"
            >
              Retry Loading Patient
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-specific Error Boundary for Encounter components
 */
export class EncounterErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('EncounterErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="encounter-error-boundary">
          <div className="encounter-error-boundary__content">
            <h3>Encounter Data Error</h3>
            <p>Unable to load encounter information. Please try again or contact support.</p>
            <button 
              onClick={this.resetErrorBoundary}
              className="encounter-error-boundary__retry-btn"
              type="button"
            >
              Retry Loading Encounters
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-specific Error Boundary for Theme system
 */
export class ThemeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('ThemeErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="theme-error-boundary">
          <div className="theme-error-boundary__content">
            <h3>Theme System Error</h3>
            <p>Unable to load theme preferences. Using default light theme.</p>
            <button 
              onClick={this.resetErrorBoundary}
              className="theme-error-boundary__retry-btn"
              type="button"
            >
              Retry Theme Loading
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-specific Error Boundary for I18n system
 */
export class I18nErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('I18nErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="i18n-error-boundary">
          <div className="i18n-error-boundary__content">
            <h3>Translation System Error</h3>
            <p>Unable to load translations. Using default English text.</p>
            <button 
              onClick={this.resetErrorBoundary}
              className="i18n-error-boundary__retry-btn"
              type="button"
            >
              Retry Translation Loading
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-specific Error Boundary for Modal system
 */
export class ModalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      console.error('ModalErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="modal-error-boundary">
          <div className="modal-error-boundary__content">
            <h3>Modal System Error</h3>
            <p>Unable to display modal content. Please try again.</p>
            <button 
              onClick={this.resetErrorBoundary}
              className="modal-error-boundary__retry-btn"
              type="button"
            >
              Retry Modal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}