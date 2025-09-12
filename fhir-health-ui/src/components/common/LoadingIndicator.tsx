import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
  inline?: boolean;
}

/**
 * Accessible loading indicator component
 * Provides visual and screen reader feedback for loading states
 */
export function LoadingIndicator({ 
  size = 'medium', 
  message = 'Loading...', 
  className = '',
  inline = false 
}: LoadingIndicatorProps): React.JSX.Element {
  return (
    <div 
      className={`loading-indicator loading-indicator--${size} ${inline ? 'loading-indicator--inline' : ''} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="loading-indicator__spinner" aria-hidden="true">
        <div className="loading-indicator__dot loading-indicator__dot--1"></div>
        <div className="loading-indicator__dot loading-indicator__dot--2"></div>
        <div className="loading-indicator__dot loading-indicator__dot--3"></div>
      </div>
      <span className="loading-indicator__message">
        {message}
      </span>
      {/* Screen reader only text */}
      <span className="sr-only">
        Please wait while content is loading
      </span>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

/**
 * Loading overlay component that covers its children during loading
 */
export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children 
}: LoadingOverlayProps): React.JSX.Element {
  return (
    <div className="loading-overlay-container">
      {children}
      {isLoading && (
        <div className="loading-overlay">
          <LoadingIndicator message={message} size="large" />
        </div>
      )}
    </div>
  );
}

export default LoadingIndicator;