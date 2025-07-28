import { randomBytes } from 'crypto';
import Salsa20 from 'salsa20';

export function encryptData(text) {
  const key = randomBytes(32);
  const nonce = randomBytes(8);
  const cipher = new Salsa20(key, nonce);

  const encrypted = cipher.encrypt(Buffer.from(text, 'utf-8'));

  return {
    key: key.toString('base64'),
    nonce: nonce.toString('base64'),
    ciphertext: Buffer.from(encrypted).toString('base64')
  };
}
