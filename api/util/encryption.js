// Encryption utility using Node.js crypto module
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Generate or get encryption key from environment
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) { // 32 bytes = 64 hex chars
    return Buffer.from(envKey, 'hex');
  }
  
  // Fallback: derive key from JWT_SECRET (not ideal but better than nothing)
  const fallbackSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  return crypto.scryptSync(fallbackSecret, 'salt', KEY_LENGTH);
}

// Encrypt sensitive data
export function encryptData(plaintext) {
  try {
    if (!plaintext) return { data: '', encrypted: true };
    
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('KeyKeep-Vault')); // Additional authenticated data
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const combined = iv.toString('hex') + tag.toString('hex') + encrypted;
    
    return {
      data: combined,
      encrypted: true
    };
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to plain text if encryption fails
    return {
      data: plaintext,
      encrypted: false
    };
  }
}

// Decrypt sensitive data
export function decryptData(encryptedData) {
  try {
    if (!encryptedData || encryptedData.length < (IV_LENGTH + TAG_LENGTH) * 2) {
      return encryptedData; // Return as-is if not properly encrypted
    }
    
    const key = getEncryptionKey();
    
    // Extract components
    const iv = Buffer.from(encryptedData.substr(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedData.substr(IV_LENGTH * 2, TAG_LENGTH * 2), 'hex');
    const encrypted = encryptedData.substr((IV_LENGTH + TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('KeyKeep-Vault'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original data if decryption fails
    return encryptedData;
  }
}

// Legacy function for backward compatibility
export function storeData(secret) {
  return encryptData(secret);
}

// Utility to encrypt multiple fields
export function encryptVaultData(data) {
  const encrypted = { ...data };
  
  // Encrypt sensitive fields
  if (data.password) {
    const passwordResult = encryptData(data.password);
    encrypted.password = passwordResult.data;
  }
  
  if (data.username) {
    const usernameResult = encryptData(data.username);
    encrypted.username = usernameResult.data;
  }
  
  if (data.notes) {
    const notesResult = encryptData(data.notes);
    encrypted.notes = notesResult.data;
  }
  
  return encrypted;
}

// Utility to decrypt multiple fields
export function decryptVaultData(data) {
  const decrypted = { ...data };
  
  // Decrypt sensitive fields
  if (data.password) {
    decrypted.password = decryptData(data.password);
  }
  
  if (data.username) {
    decrypted.username = decryptData(data.username);
  }
  
  if (data.notes) {
    decrypted.notes = decryptData(data.notes);
  }
  
  return decrypted;
}
