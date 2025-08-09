// Simple storage utility - no encryption
export function storeData(secret) {
  // Simply return the secret as-is for plain text storage
  return {
    data: secret
  };
}
