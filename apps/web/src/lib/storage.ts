import { encryptAES, decryptAES, exportKey, importKey, generateAESKey } from './crypto';

/**
 * Secure storage manager using Web Crypto API
 * Encrypts sensitive data before storing in localStorage
 */

const STORAGE_KEY_PREFIX = 'savote_secure_';
const MASTER_KEY_NAME = 'master_key';

class SecureStorage {
  private masterKey: CryptoKey | null = null;

  /**
   * Initialize secure storage with master key
   * Creates a new master key if none exists
   */
  async initialize(): Promise<void> {
    const storedKey = localStorage.getItem(STORAGE_KEY_PREFIX + MASTER_KEY_NAME);
    
    if (storedKey) {
      try {
        const jwk = JSON.parse(storedKey);
        this.masterKey = await importKey(jwk);
      } catch (error) {
        console.error('Failed to import master key:', error);
        await this.createMasterKey();
      }
    } else {
      await this.createMasterKey();
    }
  }

  /**
   * Create and store a new master encryption key
   */
  private async createMasterKey(): Promise<void> {
    this.masterKey = await generateAESKey();
    const jwk = await exportKey(this.masterKey);
    localStorage.setItem(
      STORAGE_KEY_PREFIX + MASTER_KEY_NAME,
      JSON.stringify(jwk)
    );
  }

  /**
   * Ensure master key is initialized
   */
  private async ensureInitialized(): Promise<CryptoKey> {
    if (!this.masterKey) {
      await this.initialize();
    }
    if (!this.masterKey) {
      throw new Error('Failed to initialize master key');
    }
    return this.masterKey;
  }

  /**
   * Store encrypted data
   */
  async setItem(key: string, value: string): Promise<void> {
    const masterKey = await this.ensureInitialized();
    const encrypted = await encryptAES(masterKey, value);
    localStorage.setItem(STORAGE_KEY_PREFIX + key, encrypted);
  }

  /**
   * Retrieve and decrypt data
   */
  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!encrypted) {
      return null;
    }

    try {
      const masterKey = await this.ensureInitialized();
      return await decryptAES(masterKey, encrypted);
    } catch (error) {
      console.error('Failed to decrypt item:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    localStorage.removeItem(STORAGE_KEY_PREFIX + key);
  }

  /**
   * Clear all secure storage
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    this.masterKey = null;
  }

  /**
   * Store JSON object (encrypted)
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieve JSON object (decrypted)
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const json = await this.getItem(key);
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(STORAGE_KEY_PREFIX + key) !== null;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

/**
 * Session storage wrapper (not encrypted, but cleared on tab close)
 */
export const sessionStore = {
  setItem(key: string, value: string): void {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + key, value);
  },

  getItem(key: string): string | null {
    return sessionStorage.getItem(STORAGE_KEY_PREFIX + key);
  },

  removeItem(key: string): void {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX + key);
  },

  clear(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  },

  setJSON<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  },

  getJSON<T>(key: string): T | null {
    const json = this.getItem(key);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  },
};
