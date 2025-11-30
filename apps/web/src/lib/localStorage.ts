import { STORAGE_KEYS } from './constants';
import { secureStorage } from './storage';

export interface NullifierSecretRecord {
  version: 'v1';
  secret: string;
  studentIdHash: string;
  createdAt: number;
}

const CURRENT_NULLIFIER_VERSION: NullifierSecretRecord['version'] = 'v1';

/**
 * Type-safe local storage wrapper
 */
export const storage = {
  /**
   * Set access token (encrypted)
   */
  setAccessToken: async (token: string) => {
    await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /**
   * Get access token
   */
  getAccessToken: async () => {
    return await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Set refresh token (encrypted)
   */
  setRefreshToken: async (token: string) => {
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  /**
   * Get refresh token
   */
  getRefreshToken: async () => {
    return await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Set nullifier secret (encrypted)
   */
  setNullifierSecret: async (secret: string, studentIdHash: string) => {
    const record: NullifierSecretRecord = {
      version: CURRENT_NULLIFIER_VERSION,
      secret,
      studentIdHash,
      createdAt: Date.now(),
    };
    await secureStorage.setItem(STORAGE_KEYS.NULLIFIER_SECRET, JSON.stringify(record));
  },

  /**
   * Get nullifier secret
   */
  getNullifierSecret: async (): Promise<NullifierSecretRecord | null> => {
    const payload = await secureStorage.getItem(STORAGE_KEYS.NULLIFIER_SECRET);
    if (!payload) {
      return null;
    }

    try {
      const parsed = JSON.parse(payload) as NullifierSecretRecord;
      if (!parsed.secret || !parsed.studentIdHash) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Clear all auth data
   */
  clearAuth: () => {
    secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    secureStorage.removeItem(STORAGE_KEYS.NULLIFIER_SECRET);
    secureStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },
};
