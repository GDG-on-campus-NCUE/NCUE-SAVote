import { useState, useEffect, useCallback } from 'react';
import { generateNullifierSecret, nullifierToHex, hexToNullifier } from '../services/crypto.service';
import { storage, NullifierSecretRecord } from '../../../lib/localStorage';
import { useAuthStore } from '../stores/authStore';

const HEX_PATTERN = /^[0-9a-f]{64}$/i;

export const useNullifierSecret = () => {
  const user = useAuthStore(state => state.user);
  const setNullifierSecretStatus = useAuthStore(state => state.setNullifierSecretStatus);

  const [secret, setSecret] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const studentIdHash = user?.studentIdHash ?? null;

  const loadSecret = useCallback(async () => {
    const stored = await storage.getNullifierSecret();

    if (!stored) {
      setSecret(null);
      setNullifierSecretStatus(false);
      return null;
    }

    if (studentIdHash && stored.studentIdHash !== studentIdHash) {
      setSecret(null);
      setNullifierSecretStatus(false);
      setValidationError('SECRET_MISMATCH');
      return null;
    }

    setSecret(stored.secret);
    setNullifierSecretStatus(true);
    setValidationError(null);
    return stored.secret;
  }, [studentIdHash, setNullifierSecretStatus]);

  useEffect(() => {
    if (studentIdHash) {
      loadSecret();
    }
  }, [studentIdHash, loadSecret]);

  const ensureUserContext = () => {
    if (!studentIdHash) {
      throw new Error('User context is required');
    }
  };

  const persistSecret = async (secretHex: string) => {
    ensureUserContext();
    if (!HEX_PATTERN.test(secretHex)) {
      throw new Error('INVALID_FORMAT');
    }

    // Validate using crypto conversion for additional guard
    hexToNullifier(secretHex);

    await storage.setNullifierSecret(secretHex.toLowerCase(), studentIdHash!);
    setSecret(secretHex.toLowerCase());
    setNullifierSecretStatus(true);
    setValidationError(null);
    return secretHex.toLowerCase();
  };

  const generateNewSecret = async () => {
    ensureUserContext();
    const newSecretBytes = generateNullifierSecret();
    const newSecretHex = nullifierToHex(newSecretBytes);
    return persistSecret(newSecretHex);
  };

  const saveSecret = async (secretHex: string): Promise<boolean> => {
    try {
      await persistSecret(secretHex);
      return true;
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      return false;
    }
  };

  const restoreSecret = async (secretHex: string) => {
    try {
      const storedSecret = await persistSecret(secretHex);
      return { success: true, secret: storedSecret };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      setValidationError(message);
      return { success: false, message };
    }
  };

  const getStoredRecord = async (): Promise<NullifierSecretRecord | null> => {
    return storage.getNullifierSecret();
  };

  return {
    secret,
    generateNewSecret,
    saveSecret,
    restoreSecret,
    loadSecret,
    getStoredRecord,
    hasSecret: !!secret,
    validationError,
    isReady: !!studentIdHash,
  };
};
