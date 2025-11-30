import { describe, it, expect } from 'vitest';
import { generateNullifierSecret, nullifierToHex, hexToNullifier } from '../../src/features/auth/services/crypto.service';

describe('Crypto Service', () => {
  it('should generate a 32-byte nullifier secret', () => {
    const secret = generateNullifierSecret();
    expect(secret).toBeInstanceOf(Uint8Array);
    expect(secret.length).toBe(32);
  });

  it('should convert nullifier secret to 64-char hex string', () => {
    const secret = generateNullifierSecret();
    const hex = nullifierToHex(secret);
    expect(typeof hex).toBe('string');
    expect(hex.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
  });

  it('should convert hex string back to original nullifier secret', () => {
    const secret = generateNullifierSecret();
    const hex = nullifierToHex(secret);
    const restored = hexToNullifier(hex);
    expect(restored).toEqual(secret);
  });

  it('should throw error for invalid hex length', () => {
    expect(() => hexToNullifier('123')).toThrow('Invalid nullifier hex length');
  });
});
