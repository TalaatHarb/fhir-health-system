import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { LoadingProps } from '../../types';
import './Loading.css';

export function Loading({ 
  size = 'medium', 
  text = 'Loading...', 
  className = '',
  children 
}: LoadingProps): React.JSX.Element {
  return (
    <div className={`loading-container loading-container--${size} ${className}`} role="status">
      <LoadingSpinner 
        size={size} 
        text={text}
        aria-label={text}
      />
      {children}
    </div>
  );
}