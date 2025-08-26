import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { LoginCredentials } from '../../types';
import './LoginPage.css';

interface LoginPageProps {
  onLogin?: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps): React.JSX.Element {
  const { login, loading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [formError, setFormError] = useState<string>('');

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || '/app';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onLogin) {
        onLogin();
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, onLogin, navigate, from]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear form error when user starts typing
    if (formError) {
      setFormError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    // Basic validation - but allow empty credentials for fake login
    if (!credentials.username.trim() && !credentials.password.trim()) {
      // Allow empty login for development
      setCredentials({
        username: 'demo-user',
        password: 'demo-password',
      });
    }

    try {
      await login(credentials.username.trim() ? credentials : {
        username: 'demo-user',
        password: 'demo-password',
      });
      // Navigation will be handled by useEffect
    } catch (err) {
      setFormError('Login failed. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    setCredentials({
      username: 'demo-user',
      password: 'demo-password',
    });
    
    try {
      await login({
        username: 'demo-user',
        password: 'demo-password',
      });
      // Navigation will be handled by useEffect
    } catch (err) {
      setFormError('Demo login failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>FHIR Resource Visualizer</h1>
          <p>Healthcare Data Visualization Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter username (optional for demo)"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter password (optional for demo)"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {(error || formError) && (
            <div className="error-message" role="alert">
              {error || formError}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="login-button primary"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <button
              type="button"
              className="login-button secondary"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Demo Login
            </button>
          </div>

          <div className="login-info">
            <p>
              <strong>Development Mode:</strong> This is a fake login page for development purposes.
              You can enter any credentials or use the Demo Login button.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}