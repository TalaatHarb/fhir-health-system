import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading" role="status" aria-label="Loading authentication">
        <div className="loading-spinner">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required, always render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
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