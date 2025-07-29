import { Salsa20 } from 'salsa20';

export function encryptData(secret) {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
  const nonce = crypto.getRandomValues(new Uint8Array(8)); // 64-bit nonce

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(secret);

  const cipher = new Salsa20(key, nonce);
  const encryptedBytes = cipher.encrypt(plaintext);

  return {
    ciphertext: Buffer.from(encryptedBytes).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
    key: Buffer.from(key).toString('base64') // Optional, if needed for decrypting later
  };
}
