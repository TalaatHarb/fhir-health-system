import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps): React.JSX.Element {
  const { theme, userPreference, toggleTheme, setUserPreference, isSystemThemeSupported } = useTheme();
  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    toggleTheme();
  };

  const handlePreferenceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const preference = event.target.value as 'light' | 'dark' | 'system';
    setUserPreference(preference);
  };

  // Handle keyboard navigation for button variant
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  // Announce theme changes to screen readers
  useEffect(() => {
    const announcement = `Theme changed to ${theme} mode`;
    const ariaLiveRegion = document.getElementById('theme-announcements');
    if (ariaLiveRegion) {
      ariaLiveRegion.textContent = announcement;
      // Clear after announcement
      setTimeout(() => {
        ariaLiveRegion.textContent = '';
      }, 1000);
    }
  }, [theme]);

  return (
    <div className={`theme-toggle ${className}`} role="group" aria-labelledby="theme-toggle-label">
      {showLabel && (
        <span id="theme-toggle-label" className="theme-toggle__label">
          Theme:
        </span>
      )}
      
      {isSystemThemeSupported ? (
        <select
          ref={selectRef}
          id="theme-preference"
          value={userPreference}
          onChange={handlePreferenceChange}
          className="theme-toggle__select"
          aria-label="Select theme preference"
          aria-describedby="theme-description"
        >
          <option value="system">System (Auto)</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      ) : (
        <button
          ref={buttonRef}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className="theme-toggle__button"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme. Current theme: ${theme} mode`}
          aria-describedby="theme-description"
          title={`Current theme: ${theme}. Click to switch to ${theme === 'light' ? 'dark' : 'light'} theme.`}
        >
          <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
          {showLabel && (
            <span className="theme-toggle__text">
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          )}
        </button>
      )}
      
      {/* Hidden description for screen readers */}
      <span id="theme-description" className="sr-only">
        Changes the visual theme of the application between light and dark modes
      </span>
      
      {/* ARIA live region for theme change announcements */}
      <div 
        id="theme-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      ></div>
    </div>
  );
}