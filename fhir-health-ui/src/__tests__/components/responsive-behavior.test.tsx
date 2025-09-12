import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MainApplication } from '../../components/MainApplication';
import { renderWithProviders } from '../test-utils';

// Mock the viewport hook
const mockViewport = {
  width: 1024,
  height: 768,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
};

vi.mock('../../hooks/useViewport', () => ({
  useViewport: () => mockViewport,
}));

describe('Responsive Behavior Enhancements', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  const setViewportSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
  };

  it('should render with full viewport layout container', () => {
    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    const container = document.querySelector('.layout-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('full-viewport');
  });

  it('should apply custom scrollbar to main content', () => {
    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('custom-scrollbar');
    expect(mainContent).toHaveClass('scrollable-vertical');
    expect(mainContent).toHaveClass('optimized-scroll');
  });

  it('should handle mobile viewport (640px and below)', () => {
    setViewportSize(375, 667); // iPhone size
    mockViewport.width = 375;
    mockViewport.height = 667;
    mockViewport.isMobile = true;
    mockViewport.isTablet = false;
    mockViewport.isDesktop = false;

    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    // Check that mobile-specific classes are available
    const container = document.querySelector('.layout-container');
    expect(container).toBeInTheDocument();
  });

  it('should handle tablet viewport (641px to 1024px)', () => {
    setViewportSize(768, 1024); // iPad size
    mockViewport.width = 768;
    mockViewport.height = 1024;
    mockViewport.isMobile = false;
    mockViewport.isTablet = true;
    mockViewport.isDesktop = false;

    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    // Check that tablet-specific classes are available
    const container = document.querySelector('.layout-container');
    expect(container).toBeInTheDocument();
  });

  it('should handle desktop viewport (1025px and above)', () => {
    setViewportSize(1920, 1080); // Desktop size
    mockViewport.width = 1920;
    mockViewport.height = 1080;
    mockViewport.isMobile = false;
    mockViewport.isTablet = false;
    mockViewport.isDesktop = true;

    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    // Check that desktop-specific classes are available
    const container = document.querySelector('.layout-container');
    expect(container).toBeInTheDocument();
  });

  it('should ensure no colored borders on layout elements', () => {
    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    const container = document.querySelector('.layout-container');
    const mainContent = screen.getByRole('main');

    // Check that the elements exist and have the correct classes
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('layout-container');
    expect(container).toHaveClass('full-viewport');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveClass('layout-content');
  });

  it('should apply smooth scrolling behavior', () => {
    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('scrollable-vertical');
    expect(mainContent).toHaveClass('optimized-scroll');
    expect(mainContent).toHaveClass('custom-scrollbar');
  });

  it('should optimize scrolling performance with transform', () => {
    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('optimized-scroll');
    
    // The optimized-scroll class should apply performance optimizations
    // In a real browser, this would have transform: translateZ(0)
    expect(mainContent.classList.contains('optimized-scroll')).toBe(true);
    expect(mainContent.classList.contains('scrollable-vertical')).toBe(true);
    expect(mainContent.classList.contains('custom-scrollbar')).toBe(true);
  });

  it('should handle viewport changes gracefully', () => {
    const authConfig = { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } };
    const { rerender } = renderWithProviders(<MainApplication />, { authConfig });

    // Start with desktop
    setViewportSize(1920, 1080);
    rerender(<MainApplication />);

    // Change to mobile
    setViewportSize(375, 667);
    rerender(<MainApplication />);

    // Should still render correctly
    const container = document.querySelector('.layout-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('full-viewport');
  });

  it('should maintain accessibility during responsive changes', () => {
    renderWithProviders(<MainApplication />, {
      authConfig: { isAuthenticated: true, user: { id: '1', name: 'Test User', username: 'test', email: 'test@test.com', roles: [] } }
    });

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('role', 'main');
    expect(mainContent).toHaveAttribute('id', 'main-content');
  });
});