import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme, themeConfig } from '../../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn();

// Test component that uses the theme context
function TestComponent() {
  const { theme, userPreference, toggleTheme, setUserPreference } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="user-preference">{userPreference}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="set-light" onClick={() => setUserPreference('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setUserPreference('dark')}>
        Set Dark
      </button>
      <button data-testid="set-system" onClick={() => setUserPreference('system')}>
        Set System
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
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
    
    // Default matchMedia implementation
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide default theme context values', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('user-preference')).toHaveTextContent('system');
  });

  it('should toggle between light and dark themes', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    const themeDisplay = screen.getByTestId('current-theme');

    expect(themeDisplay).toHaveTextContent('light');

    await act(async () => {
      toggleButton.click();
    });

    expect(themeDisplay).toHaveTextContent('dark');

    await act(async () => {
      toggleButton.click();
    });

    expect(themeDisplay).toHaveTextContent('light');
  });

  it('should set user preference correctly', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = screen.getByTestId('set-dark');
    const preferenceDisplay = screen.getByTestId('user-preference');
    const themeDisplay = screen.getByTestId('current-theme');

    await act(async () => {
      setDarkButton.click();
    });

    expect(preferenceDisplay).toHaveTextContent('dark');
    expect(themeDisplay).toHaveTextContent('dark');
  });

  it('should persist user preference to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = screen.getByTestId('set-dark');

    await act(async () => {
      setDarkButton.click();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('fhir-theme-preference', 'dark');
  });

  it('should load user preference from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('user-preference')).toHaveTextContent('dark');
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('should respect system preference when user preference is system', () => {
    // Mock dark system preference
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('user-preference')).toHaveTextContent('system');
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('should apply theme colors to DOM', () => {
    const setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');
    const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check that CSS custom properties are set
    expect(setPropertySpy).toHaveBeenCalledWith('--theme-primary', themeConfig.light.primary);
    expect(setPropertySpy).toHaveBeenCalledWith('--theme-secondary', themeConfig.light.secondary);
    expect(setPropertySpy).toHaveBeenCalledWith('--theme-accent', themeConfig.light.accent);
    expect(setPropertySpy).toHaveBeenCalledWith('--theme-dark', themeConfig.light.dark);
    expect(setPropertySpy).toHaveBeenCalledWith('color-scheme', 'light');

    // Check that data-theme attribute is set
    expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'light');
  });
});