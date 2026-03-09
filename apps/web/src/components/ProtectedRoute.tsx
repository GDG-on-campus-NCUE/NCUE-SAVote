import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { UserRole } from '@savote/shared-types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save intended destination
    sessionStorage.setItem('savote_secure_intended_path', location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  // Check role authorization
  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    console.warn(`Unauthorized access attempt to ${location.pathname} by role ${user.role}`);
    return <Navigate to="/auth/unauthorized" replace />;
  }

  return <>{children}</>;
}
