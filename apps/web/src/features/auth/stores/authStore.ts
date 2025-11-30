import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, UserProfile } from '@savote/shared-types';
import { storage } from '../../../lib/localStorage';

interface AuthStore extends AuthState {
  hasNullifierSecret: boolean;
  
  // Actions
  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  setNullifierSecretStatus: (hasSecret: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasNullifierSecret: false,

      // Set authentication tokens and user
      setAuth: (accessToken, refreshToken, user) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
        // Async storage update
        storage.setAccessToken(accessToken);
        storage.setRefreshToken(refreshToken);
      },

      setNullifierSecretStatus: (hasSecret) => {
        set({ hasNullifierSecret: hasSecret });
      },

      // Clear authentication
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          hasNullifierSecret: false,
        });
        storage.clearAuth();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasNullifierSecret: state.hasNullifierSecret,
      }),
    }
  )
);
