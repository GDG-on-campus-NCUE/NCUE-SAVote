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
  const { isAuthenticated, hasNullifierSecret, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save intended destination
    sessionStorage.setItem('savote_secure_intended_path', location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  // Get user role to check if admin
  const isAdmin = user?.role === 'ADMIN';

  // Admin users don't need nullifier secret
  // If authenticated but no secret, and not admin, and not already on setup page, redirect to setup
  if (!hasNullifierSecret && !isAdmin && location.pathname !== '/auth/setup') {
    return <Navigate to="/auth/setup" replace />;
  }

  // If authenticated AND has secret (or is admin), and trying to access setup page, redirect to home
  if ((hasNullifierSecret || isAdmin) && location.pathname === '/auth/setup') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
