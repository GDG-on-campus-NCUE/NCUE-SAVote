import { getRandomBytes } from '../../../lib/crypto';

/**
 * Generates a cryptographically secure random nullifier secret (32 bytes)
 * This secret is used to prove identity without revealing it
 */
export function generateNullifierSecret(): Uint8Array {
  return getRandomBytes(32);
}

/**
 * Converts the nullifier secret to a hex string for storage/display
 */
export function nullifierToHex(secret: Uint8Array): string {
  return Array.from(secret)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hex string back to nullifier secret Uint8Array
 */
export function hexToNullifier(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error('Invalid nullifier hex length');
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
