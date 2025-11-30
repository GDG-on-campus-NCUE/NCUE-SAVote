import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Redirects to setup if user has no nullifier secret
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, hasNullifierSecret } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save intended destination
    sessionStorage.setItem('savote_secure_intended_path', location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  // If authenticated but no secret, and not already on setup page, redirect to setup
  if (!hasNullifierSecret && location.pathname !== '/auth/setup') {
    return <Navigate to="/auth/setup" replace />;
  }

  // If authenticated AND has secret, and trying to access setup page, redirect to home
  if (hasNullifierSecret && location.pathname === '/auth/setup') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
