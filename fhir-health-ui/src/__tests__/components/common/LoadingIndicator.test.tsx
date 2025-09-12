import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingIndicator, LoadingOverlay } from '../../../components/common/LoadingIndicator';

describe('LoadingIndicator', () => {
  it('should render with default props', () => {
    render(<LoadingIndicator />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while content is loading')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingIndicator message="Processing data..." />);
    
    expect(screen.getByText('Processing data...')).toBeInTheDocument();
    expect(screen.getByLabelText('Processing data...')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<LoadingIndicator size="small" />);
    expect(document.querySelector('.loading-indicator--small')).toBeInTheDocument();

    rerender(<LoadingIndicator size="large" />);
    expect(document.querySelector('.loading-indicator--large')).toBeInTheDocument();
  });

  it('should render inline variant', () => {
    render(<LoadingIndicator inline />);
    expect(document.querySelector('.loading-indicator--inline')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingIndicator message="Custom loading message" />);
    
    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
    expect(statusElement).toHaveAttribute('aria-label', 'Custom loading message');
  });
});

describe('LoadingOverlay', () => {
  it('should render children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should render overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true} message="Loading content...">
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('should have proper container structure', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );
    
    const container = document.querySelector('.loading-overlay-container');
    expect(container).toBeInTheDocument();
    
    const overlay = document.querySelector('.loading-overlay');
    expect(overlay).toBeInTheDocument();
  });
});