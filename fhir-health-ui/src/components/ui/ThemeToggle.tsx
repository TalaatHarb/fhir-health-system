import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = true }: ThemeToggleProps): React.JSX.Element {
  const { theme, userPreference, toggleTheme, setUserPreference, isSystemThemeSupported } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  const handlePreferenceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const preference = event.target.value as 'light' | 'dark' | 'system';
    setUserPreference(preference);
  };

  return (
    <div className={`theme-toggle ${className}`}>
      {showLabel && (
        <label htmlFor="theme-preference" className="theme-toggle__label">
          Theme:
        </label>
      )}
      
      {isSystemThemeSupported ? (
        <select
          id="theme-preference"
          value={userPreference}
          onChange={handlePreferenceChange}
          className="theme-toggle__select"
          aria-label="Select theme preference"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      ) : (
        <button
          onClick={handleToggle}
          className="theme-toggle__button"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Current theme: ${theme}. Click to switch to ${theme === 'light' ? 'dark' : 'light'} theme.`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
          {showLabel && (
            <span className="theme-toggle__text">
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}