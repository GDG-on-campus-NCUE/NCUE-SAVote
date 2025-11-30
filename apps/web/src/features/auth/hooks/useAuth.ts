import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/auth.api';
import { storage } from '../../../lib/localStorage';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth, setNullifierSecretStatus, hasNullifierSecret } = useAuthStore();

  const checkAuth = useCallback(async () => {
    const [accessToken, refreshToken, storedSecret] = await Promise.all([
      storage.getAccessToken(),
      storage.getRefreshToken(),
      storage.getNullifierSecret(),
    ]);

    setNullifierSecretStatus(!!storedSecret);

    if (accessToken && refreshToken && !isAuthenticated) {
      try {
        const userProfile = await authApi.getCurrentUser();
        setAuth(accessToken, refreshToken, userProfile);
      } catch (error) {
        console.error('Failed to hydrate auth state:', error);
        clearAuth();
      }
    }
  }, [isAuthenticated, setAuth, clearAuth, setNullifierSecretStatus]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    authApi.login();
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout request failed, forcing client cleanup', error);
    } finally {
      clearAuth();
      storage.clearAuth();
    }
  }, [clearAuth]);

  return {
    user,
    isAuthenticated,
    hasNullifierSecret,
    login,
    logout,
  };
};
