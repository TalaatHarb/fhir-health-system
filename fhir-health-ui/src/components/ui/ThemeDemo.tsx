import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

/**
 * Demo component to showcase the theme system functionality
 * This component demonstrates how to use the theme context and shows
 * the current theme colors and system capabilities
 */
export function ThemeDemo(): React.JSX.Element {
  const { theme, userPreference, systemPreference, isSystemThemeSupported } = useTheme();

  return (
    <div className="theme-demo">
      <div className="theme-demo__header">
        <h2>Theme System Demo</h2>
        <ThemeToggle />
      </div>
      
      <div className="theme-demo__info">
        <div className="theme-demo__section">
          <h3>Current Theme State</h3>
          <ul>
            <li><strong>Active Theme:</strong> {theme}</li>
            <li><strong>User Preference:</strong> {userPreference}</li>
            <li><strong>System Preference:</strong> {systemPreference}</li>
            <li><strong>System Detection:</strong> {isSystemThemeSupported ? 'Supported' : 'Not Supported'}</li>
          </ul>
        </div>

        <div className="theme-demo__section">
          <h3>Theme Colors</h3>
          <div className="theme-demo__colors">
            <div className="theme-demo__color" style={{ backgroundColor: 'var(--theme-primary)' }}>
              <span>Primary</span>
            </div>
            <div className="theme-demo__color" style={{ backgroundColor: 'var(--theme-secondary)' }}>
              <span>Secondary</span>
            </div>
            <div className="theme-demo__color" style={{ backgroundColor: 'var(--theme-accent)' }}>
              <span>Accent</span>
            </div>
            <div className="theme-demo__color" style={{ backgroundColor: theme === 'light' ? 'var(--theme-dark)' : 'var(--theme-light)' }}>
              <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
            </div>
          </div>
        </div>

        <div className="theme-demo__section">
          <h3>Interactive Elements</h3>
          <div className="theme-demo__elements">
            <button className="btn btn--primary">Primary Button</button>
            <button className="btn btn--secondary">Secondary Button</button>
            <input type="text" className="form-input" placeholder="Sample input" />
            <select className="form-select">
              <option>Sample select</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>

        <div className="theme-demo__section">
          <h3>Text and Surfaces</h3>
          <div className="theme-demo__surfaces">
            <div className="theme-demo__surface">
              <p>This is primary text on a surface background.</p>
              <p style={{ color: 'var(--color-text-secondary)' }}>This is secondary text.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}