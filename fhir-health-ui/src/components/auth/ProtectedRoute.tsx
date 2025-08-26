import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, always render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If not authenticated, show login page or custom fallback
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <LoginPage />;
  }

  // If authenticated, render children
  return <>{children}</>;
}

// Higher-order component version for class components
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; fallback?: React.ReactNode } = {}
) {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute 
      requireAuth={options.requireAuth} 
      fallback={options.fallback}
    >
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}