import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  className?: string;
  'aria-label'?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  color = 'primary', 
  text,
  className = '',
  'aria-label': ariaLabel = 'Loading'
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div 
      className={`loading-spinner loading-spinner--${size} loading-spinner--${color} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <div className="loading-spinner__circle" aria-hidden="true">
        <div className="loading-spinner__path"></div>
      </div>
      {text && (
        <span className="loading-spinner__text" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  text = 'Loading...', 
  children,
  className = ''
}: LoadingOverlayProps): React.JSX.Element {
  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <div className={`loading-overlay ${className}`}>
      {children && (
        <div className="loading-overlay__content" aria-hidden="true">
          {children}
        </div>
      )}
      <div className="loading-overlay__spinner">
        <LoadingSpinner size="large" text={text} />
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color = 'primary',
  size = 'medium',
  className = ''
}: ProgressBarProps): React.JSX.Element {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`progress-bar progress-bar--${size} progress-bar--${color} ${className}`}>
      {label && (
        <div className="progress-bar__label">
          <span>{label}</span>
          {showPercentage && (
            <span className="progress-bar__percentage">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div 
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(clampedProgress)}%`}
      >
        <div 
          className="progress-bar__fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = ''
}: SkeletonProps): React.JSX.Element {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}