import pkg from 'salsa20';
const { Salsa20 } = pkg;

export function encryptData(secret) {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
  const nonce = crypto.getRandomValues(new Uint8Array(8)); // 64-bit nonce

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(secret);

 const cipher = new Salsa20(key, nonce);
 const encryptedBytes = cipher.xor(plaintext);


  return {
    ciphertext: Buffer.from(encryptedBytes).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
    key: Buffer.from(key).toString('base64') // Optional
  };
}
