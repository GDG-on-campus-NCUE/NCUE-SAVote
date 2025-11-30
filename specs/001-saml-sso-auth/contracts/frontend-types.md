# 前端 API 合約 (TypeScript)

**目的**：為 React 前端定義型別安全的 API 客戶端

---

## 1. 身份驗證類型

```typescript
// packages/shared-types/src/auth.types.ts

/** 嵌入在 Access Token 中的 JWT Payload */
export interface JWTPayload {
  sub: string;              // 主題：SHA-256(studentId)
  class: string;            // 班級代碼 (例如 "CSIE_3A")
  iat: number;              // 發行時間 (Unix timestamp)
  exp: number;              // 過期時間 (Unix timestamp)
  jti: string;              // JWT ID (UUID)
  iss: string;              // 發行者 (例如 "voting.ncuesa.edu.tw")
}

/** 來自 /users/me 的使用者個人資料 */
export interface User {
  id: string;               // UUID
  studentIdHash: string;    // SHA-256 雜湊 (64 hex chars)
  class: string;            // 班級代碼
  email: string | null;     // 可選的電子郵件
  enrollmentStatus: boolean;
  createdAt: string;        // ISO 8601 時間戳記
  updatedAt: string;        // ISO 8601 時間戳記
}

/** 來自 /auth/saml/callback 的回應 */
export interface AuthResponse {
  accessToken: string;      // JWT access token
  refreshToken: string;     // Refresh token
  expiresIn: number;        // Token 有效期秒數 (900)
  user: User;
}

/** 對 /auth/refresh 的請求 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** 來自 /auth/refresh 的回應 */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

/** 從 IdP assertion 提取的 SAML 屬性 */
export interface SAMLAttributes {
  studentId: string;        // 明文學號 (暫時)
  class: string;
  enrollmentStatus: boolean;
}
```

---

## 2. 選民資格類型

```typescript
// packages/shared-types/src/voter.types.ts

/** 對 /voters/verify-eligibility 的請求 */
export interface VerifyEligibilityRequest {
  electionId: string;       // UUID
}

/** 來自 /voters/verify-eligibility 的回應 */
export interface VerifyEligibilityResponse {
  eligible: boolean;
  merkleRootHash: string;   // 十六進位字串 (64 chars)
  merkleProof?: string[];   // 十六進位字串陣列 (如果符合資格)
  leafIndex?: number;       // Merkle Tree 中的位置
}

/** 合格選民記錄 (管理員使用) */
export interface EligibleVoter {
  id: string;               // UUID
  studentId: string;        // 明文學號
  class: string;
  electionId: string;
  createdAt: string;
}

/** 來自 /voters/import 的回應 */
export interface ImportVotersResponse {
  votersImported: number;
  merkleRootHash: string;
  duplicatesSkipped: number;
}
```

---

## 3. 錯誤回應類型

```typescript
// packages/shared-types/src/error.types.ts

/** 標準 API 錯誤回應 */
export interface APIError {
  statusCode: number;
  message: string;
  error: string;            // 錯誤類型 (例如 "Bad Request")
  details?: ValidationError[];
}

/** 驗證錯誤詳情 */
export interface ValidationError {
  field: string;
  message: string;
}
```

---

## 4. 前端 API 客戶端

```typescript
// apps/web/src/features/auth/services/auth.api.ts

import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  APIError
} from '@savote/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class AuthAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 請求攔截器：新增 JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 回應攔截器：處理 token 重新整理
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post<RefreshTokenResponse>(
              `${API_BASE_URL}/auth/refresh`,
              { refreshToken }
            );

            localStorage.setItem('access_token', data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // 重新整理失敗，登出使用者
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 啟動 SAML SSO 登入
   * 重新導向至 IdP，不回傳資料
   */
  async startSAMLLogin(): Promise<void> {
    window.location.href = `${API_BASE_URL}/auth/saml/login`;
  }

  /**
   * 取得當前使用者個人資料
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/users/me');
    return data;
  }

  /**
   * 更新使用者個人資料
   */
  async updateProfile(email: string | null): Promise<User> {
    const { data } = await this.client.patch<User>('/users/me', { email });
    return data;
  }

  /**
   * 重新整理 Access Token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await this.client.post<RefreshTokenResponse>(
      '/auth/refresh',
      { refreshToken }
    );
    return data;
  }

  /**
   * 登出使用者
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      // 即使請求失敗也清除 Local Storage
      localStorage.clear();
    }
  }
}

export const authAPI = new AuthAPI();
```

---

## 5. 選民資格 API 客戶端

```typescript
// apps/web/src/features/auth/services/voter.api.ts

import axios, { AxiosInstance } from 'axios';
import type {
  VerifyEligibilityRequest,
  VerifyEligibilityResponse,
} from '@savote/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class VoterAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 新增 JWT token 到請求
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * 檢查當前使用者是否符合選舉資格
   */
  async verifyEligibility(
    request: VerifyEligibilityRequest
  ): Promise<VerifyEligibilityResponse> {
    const { data } = await this.client.post<VerifyEligibilityResponse>(
      '/voters/verify-eligibility',
      request
    );
    return data;
  }
}

export const voterAPI = new VoterAPI();
```

---

## 6. React Query Hooks

```typescript
// apps/web/src/features/auth/hooks/useAuth.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../services/auth.api';
import type { User } from '@savote/shared-types';

/** 取得當前使用者個人資料 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 分鐘
    retry: 1,
  });
}

/** 更新使用者個人資料 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string | null) => authAPI.updateProfile(email),
    onSuccess: (updatedUser) => {
      // 更新快取
      queryClient.setQueryData(['user', 'me'], updatedUser);
    },
  });
}

/** 登出 Mutation */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // 清除所有快取資料
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}
```

---

## 7. 前端常數

```typescript
// apps/web/src/lib/constants.ts

/** LocalStorage Keys */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  NULLIFIER_SECRET: 'ncuesa_voting_nullifier_secret_v1',
  USER_PROFILE: 'user_profile',
} as const;

/** Token 過期時間 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60 * 1000,  // 15 分鐘 (毫秒)
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 天 (毫秒)
} as const;

/** API 端點 */
export const API_ENDPOINTS = {
  AUTH: {
    SAML_LOGIN: '/auth/saml/login',
    SAML_CALLBACK: '/auth/saml/callback',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    JWKS: '/auth/jwks',
  },
  USERS: {
    ME: '/users/me',
  },
  VOTERS: {
    VERIFY_ELIGIBILITY: '/voters/verify-eligibility',
    IMPORT: '/voters/import',
  },
} as const;
```

---

## 摘要

前端合約包含：
1. **型別定義**：`shared-types` 套件中的所有 API 請求/回應型別
2. **API 客戶端**：基於 Axios 的客戶端，包含用於 Token 管理的攔截器
3. **React Query Hooks**：具有快取和樂觀更新的資料獲取 Hooks
4. **常數**：集中管理的儲存 Keys、端點和設定

**型別安全**：完整的 TypeScript 覆蓋確保 API 呼叫的編譯時驗證。
