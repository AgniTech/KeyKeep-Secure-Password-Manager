import sodium from 'libsodium-wrappers';

let sodiumReady = false;

export async function initCrypto() {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
  // You can generate key once and reuse/store it securely
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  return key;
}

export function encryptPassword(plainText, key) {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const encrypted = sodium.crypto_secretbox_easy(
    sodium.from_string(plainText),
    nonce,
    key
  );
  return {
    encrypted: sodium.to_base64(encrypted),
    nonce: sodium.to_base64(nonce)
  };
}

export function decryptPassword(encryptedBase64, nonceBase64, key) {
  const nonce = sodium.from_base64(nonceBase64);
  const encrypted = sodium.from_base64(encryptedBase64);
  const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);

  if (!decrypted) throw new Error('Failed to decrypt. Wrong key or tampered data.');
  return sodium.to_string(decrypted);
}
