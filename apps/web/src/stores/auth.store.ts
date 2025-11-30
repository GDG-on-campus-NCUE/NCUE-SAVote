import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, UserProfile } from '@savote/shared-types';
import { apiClient } from '../lib/api-client';

interface AuthStore extends AuthState {
    // Actions
    setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => void;
    clearAuth: () => void;
    loadUser: () => Promise<void>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            // Set authentication tokens and user
            setAuth: (accessToken, refreshToken, user) => {
                apiClient.saveTokens(accessToken, refreshToken);
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            // Clear authentication
            clearAuth: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            // Load user profile from API
            loadUser: async () => {
                try {
                    const response = await apiClient.getCurrentUser();
                    if (response.success && response.data) {
                        set({
                            user: response.data,
                            isAuthenticated: true,
                        });
                    }
                } catch (error) {
                    console.error('Failed to load user:', error);
                    get().clearAuth();
                }
            },

            // Logout current session
            logout: async () => {
                try {
                    await apiClient.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    get().clearAuth();
                }
            },

            // Logout all sessions
            logoutAll: async () => {
                try {
                    await apiClient.logoutAll();
                } catch (error) {
                    console.error('Logout all error:', error);
                } finally {
                    get().clearAuth();
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                // Only persist user profile, not tokens
                // Tokens are stored separately in localStorage by api-client
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
