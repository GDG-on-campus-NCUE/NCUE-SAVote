export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  NULLIFIER_SECRET: 'nullifier_secret',
  USER_PROFILE: 'user_profile',
  THEME: 'theme',
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ADMIN_LOGIN: '/auth/admin/login',
    CALLBACK: '/auth/callback',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/users/me',
  },
  VOTERS: {
    IMPORT: '/voters/import',
    VERIFY: '/voters/verify-eligibility',
  },
  ELECTIONS: {
    LIST: '/elections',
    CREATE: '/elections',
    GET: (id: string) => `/elections/${id}`,
  },
  VOTES: {
    SUBMIT: '/votes/submit',
    TALLY: (id: string) => `/votes/${id}/tally`,
    LOGS: (id: string) => `/votes/${id}/logs`,
  },
} as const;