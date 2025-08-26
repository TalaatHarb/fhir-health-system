import React from 'react';
import type { LoadingProps } from '../../types';
import './Loading.css';

export function Loading({ 
  size = 'medium', 
  text = 'Loading...', 
  className = '',
  children 
}: LoadingProps): React.JSX.Element {
  return (
    <div className={`loading-container ${size} ${className}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
        {text && <p className="loading-text">{text}</p>}
        {children}
      </div>
    </div>
  );
}