import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types';

// Use the global localStorage mock from setup
const localStorageMock = (globalThis as any).localStorageMock;

// Test component to access auth context
function TestComponent() {
  const { isAuthenticated, user, login, logout, loading, error } = useAuth();

  const handleLogin = async () => {
    const credentials: LoginCredentials = {
      username: 'testuser',
      password: 'testpass',
    };
    await login(credentials);
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.name} (${user.username})` : 'no-user'}
      </div>
      <div data-testid="loading-status">
        {loading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="error-status">
        {error || 'no-error'}
      </div>
      <button onClick={handleLogin} data-testid="login-button">
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide initial unauthenticated state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error-status')).toHaveTextContent('no-error');
  });

  it('should handle successful login', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    // Should show loading state
    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Testuser User (testuser)');
    });
    
    expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error-status')).toHaveTextContent('no-error');
  });

  it('should handle logout', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // First login
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Then logout
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error-status')).toHaveTextContent('no-error');
  });

  it('should persist authentication state to localStorage', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'fhir-auth',
        expect.stringContaining('"isAuthenticated":true')
      );
    });
  });

  it('should restore authentication state from localStorage', () => {
    const savedAuth = JSON.stringify({
      isAuthenticated: true,
      user: {
        id: 'user-123',
        username: 'saveduser',
        name: 'Saved User',
        email: 'saved@example.com',
        roles: ['healthcare-professional'],
      },
    });

    localStorageMock.getItem.mockReturnValue(savedAuth);

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent('Saved User (saveduser)');
  });

  it('should handle corrupted localStorage data', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('fhir-auth');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should clear localStorage on logout', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Login first
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Then logout
    const logoutButton = screen.getByTestId('logout-button');
    fireEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('fhir-auth');
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});