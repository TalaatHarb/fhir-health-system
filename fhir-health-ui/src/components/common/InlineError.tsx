import React from 'react';
import type { BaseComponentProps } from '../../types';
import './InlineError.css';

interface InlineErrorProps extends BaseComponentProps {
  error?: string | null;
  show?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: boolean;
}

/**
 * Inline Error Message Component
 * Used for displaying validation errors in forms
 */
export function InlineError({ 
  error, 
  show = true, 
  size = 'medium',
  icon = true,
  className = '',
  ...props 
}: InlineErrorProps): React.JSX.Element | null {
  if (!error || !show) {
    return null;
  }

  return (
    <div 
      className={`inline-error inline-error--${size} ${className}`}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {icon && (
        <span className="inline-error__icon" aria-hidden="true">
          ⚠
        </span>
      )}
      <span className="inline-error__message">{error}</span>
    </div>
  );
}

interface FieldErrorProps extends BaseComponentProps {
  fieldName: string;
  errors: Record<string, string>;
  touched?: Record<string, boolean>;
  showUntouched?: boolean;
}

/**
 * Field Error Component
 * Automatically displays error for a specific form field
 */
export function FieldError({ 
  fieldName, 
  errors, 
  touched = {}, 
  showUntouched = false,
  className = '',
  ...props 
}: FieldErrorProps): React.JSX.Element | null {
  const error = errors[fieldName];
  const isFieldTouched = touched[fieldName];
  const shouldShow = Boolean(error && (showUntouched || isFieldTouched));

  return (
    <InlineError 
      error={error}
      show={shouldShow}
      className={className}
      {...props}
    />
  );
}

interface ErrorListProps extends BaseComponentProps {
  errors: string[] | Record<string, string>;
  title?: string;
  maxErrors?: number;
}

/**
 * Error List Component
 * Displays multiple errors in a list format
 */
export function ErrorList({ 
  errors, 
  title = 'Please fix the following errors:',
  maxErrors,
  className = '',
  ...props 
}: ErrorListProps): React.JSX.Element | null {
  const errorArray = Array.isArray(errors) 
    ? errors 
    : Object.values(errors).filter(Boolean);

  if (errorArray.length === 0) {
    return null;
  }

  const displayErrors = maxErrors 
    ? errorArray.slice(0, maxErrors)
    : errorArray;

  const hasMoreErrors = maxErrors && errorArray.length > maxErrors;

  return (
    <div 
      className={`error-list ${className}`}
      role="alert"
      aria-live="polite"
      {...props}
    >
      {title && (
        <div className="error-list__title">
          <span className="error-list__icon" aria-hidden="true">⚠</span>
          {title}
        </div>
      )}
      <ul className="error-list__items">
        {displayErrors.map((error, index) => (
          <li key={index} className="error-list__item">
            {error}
          </li>
        ))}
        {hasMoreErrors && (
          <li className="error-list__item error-list__item--more">
            ... and {errorArray.length - maxErrors!} more error{errorArray.length - maxErrors! > 1 ? 's' : ''}
          </li>
        )}
      </ul>
    </div>
  );
}