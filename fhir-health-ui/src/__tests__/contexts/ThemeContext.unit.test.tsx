import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme, themeConfig } from '../../contexts/ThemeContext';

// Test component that uses the theme context
const TestThemeComponent: React.FC = () => {
  const { theme, toggleTheme, setTheme, setUserPreference } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
      <button data-testid="set-system" onClick={() => setUserPreference('system')}>
        Set System
      </button>
    </div>
  );
};

describe('ThemeContext Unit Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Theme Functionality', () => {
    it('should initialize with light theme by default', async () => {
      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });
    });

    it('should switch to dark theme when setTheme is called', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });

    it('should switch to light theme when setTheme is called', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));
      await user.click(screen.getByTestId('set-light'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });
    });

    it('should toggle between themes', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );

      // Should start with light theme
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });

      // Toggle to dark
      await user.click(screen.getByTestId('toggle-theme'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });

      // Toggle back to light
      await user.click(screen.getByTestId('toggle-theme'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });
    });
  });

  describe('Theme Configuration', () => {
    it('should have correct light theme colors', () => {
      expect(themeConfig.light).toEqual({
        primary: '#DDF4E7',
        secondary: '#67C090',
        accent: '#26667F',
        dark: '#124170',
      });
    });

    it('should have correct dark theme colors', () => {
      expect(themeConfig.dark).toEqual({
        primary: '#210F37',
        secondary: '#4F1C51',
        accent: '#A55B4B',
        light: '#DCA06D',
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useTheme is used outside provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestThemeComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      console.error = originalError;
    });
  });

  describe('Local Storage Integration', () => {
    it('should persist theme preference', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));

      // Check that preference is saved to localStorage
      expect(localStorage.getItem('fhir-theme-preference')).toBe('dark');
    });

    it('should restore theme preference from localStorage', async () => {
      // Set preference in localStorage before rendering
      localStorage.setItem('fhir-theme-preference', 'dark');

      render(
        <ThemeProvider>
          <TestThemeComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });
  });
});