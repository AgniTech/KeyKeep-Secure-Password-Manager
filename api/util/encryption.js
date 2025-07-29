import sodium from 'libsodium-wrappers';

export async function encryptData(secret) {
  await sodium.ready;

  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  const ciphertext = sodium.crypto_secretbox_easy(
    sodium.from_string(secret),
    nonce,
    key
  );

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
    key: Buffer.from(key).toString('base64') // Store this securely or derive from master password
  };
}
