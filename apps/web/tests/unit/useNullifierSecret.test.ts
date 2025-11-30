import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useNullifierSecret } from '../../src/features/auth/hooks/useNullifierSecret';
import { useAuthStore } from '../../src/features/auth/stores/authStore';
import { storage } from '../../src/lib/localStorage';
import { EnrollmentStatus } from '@savote/shared-types';

const mockUser = {
  id: 'user-1',
  studentIdHash: 'hash-123',
  class: 'CSIE_3A',
  email: null,
  enrollmentStatus: EnrollmentStatus.ACTIVE,
};

describe('useNullifierSecret', () => {
  beforeEach(async () => {
    useAuthStore.setState(state => ({
      ...state,
      user: mockUser,
      isAuthenticated: true,
      hasNullifierSecret: false,
    }));
    storage.clearAuth();
  });

  it('loads stored secret for the current user', async () => {
    const secretValue = 'a'.repeat(64);
    await storage.setNullifierSecret(secretValue, mockUser.studentIdHash);

    const { result } = renderHook(() => useNullifierSecret());

    await waitFor(() => {
      expect(result.current.secret).toBe(secretValue);
    });
    expect(result.current.hasSecret).toBe(true);
    expect(result.current.validationError).toBeNull();
  });

  it('flags secret mismatch when stored hash differs', async () => {
    await storage.setNullifierSecret('b'.repeat(64), 'another-hash');

    const { result } = renderHook(() => useNullifierSecret());

    await waitFor(() => {
      expect(result.current.validationError).toBe('SECRET_MISMATCH');
    });
    expect(result.current.secret).toBeNull();
    expect(result.current.hasSecret).toBe(false);
  });

  it('rejects invalid recovery input', async () => {
    const { result } = renderHook(() => useNullifierSecret());

    let response: { success: boolean } | undefined;
    await act(async () => {
      response = await result.current.restoreSecret('1234');
    });

    expect(response?.success).toBe(false);
    expect(result.current.validationError).toBe('INVALID_FORMAT');
  });
});
