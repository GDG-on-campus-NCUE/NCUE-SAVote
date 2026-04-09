/**
 * Web Crypto API wrapper for cryptographic operations
 * All operations use browser's native SubtleCrypto API
 */

/**
 * Generate SHA-256 hash of input string
 * Used for hashing student IDs before storage
 */
export async function sha256Hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generate a random AES-GCM key for encryption
 */
export async function generateAESKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 * Returns base64-encoded ciphertext with IV prepended
 */
export async function encryptAES(
  key: CryptoKey,
  plaintext: string
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext);
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoded
  );

  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-GCM
 * Expects base64-encoded ciphertext with IV prepended
 */
export async function decryptAES(
  key: CryptoKey,
  ciphertext: string
): Promise<string> {
  // Decode base64
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  // Extract IV (first 12 bytes)
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Export CryptoKey to JWK format for storage
 */
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey('jwk', key);
}

/**
 * Import CryptoKey from JWK format
 */
export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate HMAC signature using SHA-256
 * Used for message authentication
 */
export async function hmacSign(
  key: CryptoKey,
  message: string
): Promise<string> {
  const encoded = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign('HMAC', key, encoded);
  const sigArray = Array.from(new Uint8Array(signature));
  return sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate HMAC key for signing
 */
export async function generateHMACKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
}

/**
 * Verify HMAC signature
 */
export async function hmacVerify(
  key: CryptoKey,
  signature: string,
  message: string
): Promise<boolean> {
  const encoded = new TextEncoder().encode(message);
  const sigBytes = Uint8Array.from(
    signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  return await crypto.subtle.verify('HMAC', key, sigBytes, encoded);
}

/**
 * Generate secure random bytes
 * Useful for nonces, IDs, etc.
 */
export function getRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate random hex string
 */
export function getRandomHex(length: number): string {
  const bytes = getRandomBytes(Math.ceil(length / 2));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

function importPublicKey(pem: string) {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  
  // Extract base64 content
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');

  const binaryDerString = window.atob(pemContents);
  const buf = new ArrayBuffer(binaryDerString.length);
  const bufView = new Uint8Array(buf);
  
  for (let i = 0, strLen = binaryDerString.length; i < strLen; i++) {
    bufView[i] = binaryDerString.charCodeAt(i);
  }

  // Import key for RSA-OAEP encryption
  return window.crypto.subtle.importKey(
    "spki",
    buf,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

export async function encryptWithPublicKey(text: string, pemPublicKey: string): Promise<string> {
  const publicKey = await importPublicKey(pemPublicKey);
  const encodedText = new TextEncoder().encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedText
  );

  // Convert encrypted ArrayBuffer to Base64 string for transmission
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  let binary = '';
  for (let i = 0; i < encryptedBytes.byteLength; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
  }
  
  return window.btoa(binary);
}