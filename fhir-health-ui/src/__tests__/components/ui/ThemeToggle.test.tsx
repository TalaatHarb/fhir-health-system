import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn();

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    });
    
    // Default matchMedia implementation (system supports theme detection)
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    // Default localStorage behavior
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render theme selector when system theme is supported', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByLabelText('Select theme preference')).toBeInTheDocument();
    expect(screen.getByText('Theme:')).toBeInTheDocument();
  });

  it('should render theme toggle button when system theme is not supported', () => {
    // Mock no system theme support
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: 'not all',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument(); // Should show "Dark" for light theme
  });

  it('should change theme preference when select option is changed', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const select = screen.getByLabelText('Select theme preference');
    
    fireEvent.change(select, { target: { value: 'dark' } });
    
    expect(select).toHaveValue('dark');
  });

  it('should toggle theme when button is clicked (no system support)', () => {
    // Mock no system theme support
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: 'not all',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    
    // Initially should show "Dark" (meaning current theme is light)
    expect(screen.getByText('Dark')).toBeInTheDocument();
    
    fireEvent.click(button);
    
    // After click should show "Light" (meaning current theme is dark)
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('should not show label when showLabel is false', () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel={false} />
      </ThemeProvider>
    );

    expect(screen.queryByText('Theme:')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ThemeProvider>
        <ThemeToggle className="custom-class" />
      </ThemeProvider>
    );

    const container = screen.getByLabelText('Select theme preference').closest('.theme-toggle');
    expect(container).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const select = screen.getByLabelText('Select theme preference');
    expect(select).toHaveAttribute('aria-label', 'Select theme preference');
    expect(select).toHaveAttribute('id', 'theme-preference');
  });

  it('should have proper accessibility attributes for button mode', () => {
    // Mock no system theme support
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: 'not all',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
    expect(button).toHaveAttribute('title', 'Current theme: light. Click to switch to dark theme.');
  });
});