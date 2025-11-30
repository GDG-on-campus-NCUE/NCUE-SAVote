import axios, { AxiosInstance, AxiosError } from 'axios';
import type { RefreshTokenResponse, ApiResponse } from '@savote/shared-types';

class ApiClient {
    private client: AxiosInstance;
    private refreshTokenPromise: Promise<string> | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                // If 401 and not already retried, try to refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const newAccessToken = await this.handleTokenRefresh();

                        // Retry original request with new token
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        }
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed - redirect to login
                        this.clearTokens();
                        window.location.href = '/auth/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    private getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    }

    private setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    private clearTokens(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    private async handleTokenRefresh(): Promise<string> {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshTokenPromise) {
            return this.refreshTokenPromise;
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        this.refreshTokenPromise = this.performTokenRefresh(refreshToken);

        try {
            const newAccessToken = await this.refreshTokenPromise;
            return newAccessToken;
        } finally {
            this.refreshTokenPromise = null;
        }
    }

    private async performTokenRefresh(refreshToken: string): Promise<string> {
        const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/auth/refresh`,
            { refreshToken }
        );

        if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            this.setTokens(accessToken, newRefreshToken);
            return accessToken;
        }

        throw new Error('Token refresh failed');
    }

    // Auth endpoints
    async getCurrentUser() {
        const response = await this.client.get('/auth/me');
        return response.data;
    }

    async logout() {
        try {
            await this.client.post('/auth/logout');
        } finally {
            this.clearTokens();
        }
    }

    async logoutAll() {
        try {
            await this.client.post('/auth/logout-all');
        } finally {
            this.clearTokens();
        }
    }

    // Generic request methods
    async get<T>(url: string) {
        const response = await this.client.get<T>(url);
        return response.data;
    }

    async post<T>(url: string, data?: any) {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    async put<T>(url: string, data?: any) {
        const response = await this.client.put<T>(url, data);
        return response.data;
    }

    async delete<T>(url: string) {
        const response = await this.client.delete<T>(url);
        return response.data;
    }

    // Eligible Voters API
    async importEligibleVoters(electionId: string, csv: string) {
        return this.post(`/elections/${electionId}/eligible-voters/import`, { csv });
    }

    async listEligibleVoters(electionId: string) {
        return this.get(`/elections/${electionId}/eligible-voters`);
    }

    // Token management (for callback handler)
    saveTokens(accessToken: string, refreshToken: string): void {
        this.setTokens(accessToken, refreshToken);
    }

    getTokens(): { accessToken: string | null; refreshToken: string | null } {
        return {
            accessToken: this.getAccessToken(),
            refreshToken: this.getRefreshToken(),
        };
    }
}

export const apiClient = new ApiClient();
