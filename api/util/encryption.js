import sodium from 'libsodium-wrappers';

export async function encryptData(secret, key) {
  await sodium.ready;

  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  const ciphertext = sodium.crypto_secretbox_easy(
    sodium.from_string(secret),
    nonce,
    key
  );

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
  };
}
export async function deriveKey(password, saltBase64) {
  await sodium.ready;
  const salt = Buffer.from(saltBase64, 'base64');

  return sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    password,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
}

export async function decryptPassword(ciphertextBase64, nonceBase64, key) {
  await sodium.ready;

  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const nonce = Buffer.from(nonceBase64, 'base64');

  const decrypted = sodium.crypto_secretbox_open_easy(
    ciphertext,
    nonce,
    key
  );

  return sodium.to_string(decrypted);
}
