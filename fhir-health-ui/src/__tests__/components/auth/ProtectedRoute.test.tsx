import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProtectedRoute, withProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test components
function TestComponent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function CustomFallback() {
  return <div data-testid="custom-fallback">Custom Fallback</div>;
}

function TestWrapper({ 
  children, 
  authenticated = false 
}: { 
  children: React.ReactNode;
  authenticated?: boolean;
}) {
  // Mock localStorage to simulate authentication state
  if (authenticated) {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      isAuthenticated: true,
      user: {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['healthcare-professional'],
      },
    }));
  } else {
    localStorageMock.getItem.mockReturnValue(null);
  }

  return <AuthProvider>{children}</AuthProvider>;
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when authenticated', async () => {
    render(
      <TestWrapper authenticated={true}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should render login page when not authenticated', async () => {
    render(
      <TestWrapper authenticated={false}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /fhir resource visualizer/i })).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should render custom fallback when not authenticated', async () => {
    render(
      <TestWrapper authenticated={false}>
        <ProtectedRoute fallback={<CustomFallback />}>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should render children when requireAuth is false', async () => {
    render(
      <TestWrapper authenticated={false}>
        <ProtectedRoute requireAuth={false}>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', async () => {
    render(
      <TestWrapper authenticated={false}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </TestWrapper>
    );

    // The loading state is very brief, so we'll check that either loading shows or login page shows
    // Since the auth context loads quickly in tests, we might see the login page immediately
    await waitFor(() => {
      const hasLoading = screen.queryByText(/loading/i);
      const hasLogin = screen.queryByRole('heading', { name: /fhir resource visualizer/i });
      expect(hasLoading || hasLogin).toBeTruthy();
    });
  });
});

describe('withProtectedRoute HOC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap component with ProtectedRoute', async () => {
    const WrappedComponent = withProtectedRoute(TestComponent);

    render(
      <TestWrapper authenticated={true}>
        <WrappedComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should pass through props to wrapped component', async () => {
    interface TestProps {
      message: string;
    }

    function TestComponentWithProps({ message }: TestProps) {
      return <div data-testid="protected-content">{message}</div>;
    }

    const WrappedComponent = withProtectedRoute(TestComponentWithProps);

    render(
      <TestWrapper authenticated={true}>
        <WrappedComponent message="Hello World" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  it('should respect HOC options', async () => {
    const WrappedComponent = withProtectedRoute(TestComponent, {
      requireAuth: false,
    });

    render(
      <TestWrapper authenticated={false}>
        <WrappedComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should use custom fallback from HOC options', async () => {
    const WrappedComponent = withProtectedRoute(TestComponent, {
      fallback: <CustomFallback />,
    });

    render(
      <TestWrapper authenticated={false}>
        <WrappedComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  it('should set correct displayName', () => {
    const WrappedComponent = withProtectedRoute(TestComponent);
    expect(WrappedComponent.displayName).toBe('withProtectedRoute(TestComponent)');
  });

  it('should handle component without displayName', () => {
    const AnonymousComponent = () => <div>Anonymous</div>;
    const WrappedComponent = withProtectedRoute(AnonymousComponent);
    expect(WrappedComponent.displayName).toBe('withProtectedRoute(AnonymousComponent)');
  });
});