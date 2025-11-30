import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '../../../lib/constants';
import { storage } from '../../../lib/localStorage';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse, RefreshTokenResponse, UserProfile } from '@savote/shared-types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

let refreshRequest: Promise<string> | null = null;

const performTokenRefresh = async (): Promise<string> => {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
    `${BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
    { refreshToken }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error('Token refresh failed');
  }

  const { accessToken, refreshToken: newRefreshToken } = response.data.data;
  await storage.setAccessToken(accessToken);
  await storage.setRefreshToken(newRefreshToken);

  const { user, setAuth } = useAuthStore.getState();
  if (user) {
    setAuth(accessToken, newRefreshToken, user);
  }

  return accessToken;
};

const getOrCreateRefreshRequest = () => {
  if (!refreshRequest) {
    refreshRequest = performTokenRefresh().finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const accessToken = await getOrCreateRefreshRequest();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: () => {
    window.location.href = `${BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
  },
  
  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<ApiResponse<UserProfile>>(API_ENDPOINTS.AUTH.ME);
    return response.data.data!;
  },
};
