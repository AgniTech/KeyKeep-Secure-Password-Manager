// File: /api/vault/save.js
import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import Vault from '../models/Vault.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Scoped variables for sensitive data to ensure cleanup
  let PKEK, rsaPrivateKey, vaultKey;

  try {
    await connectDB();

    // 1. Verify JWT token to get the authenticated user's ID
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Get master password and vault data from the request body
    const { masterPassword, vaultData, id: vaultId } = req.body;
    if (!masterPassword || !vaultData) {
      return res.status(400).json({ error: 'Master password and vault data are required.' });
    }

    // 3. Re-Authenticate and Derive PKEK
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isAuth = await user.comparePassword(masterPassword);
    if (!isAuth) {
      return res.status(401).json({ error: 'Invalid master password.' });
    }

    const argon2Salt = Buffer.from(user.argon2Salt, 'base64');
    PKEK = await argon2.hash(masterPassword, {
        salt: argon2Salt,
        raw: true,
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 4,
    });

    // 4. Decrypt RSA Private Key into a temporary variable
    const privateKeyIv = Buffer.from(user.privateKeyIv, 'base64');
    const privateKeyAuthTag = Buffer.from(user.privateKeyAuthTag, 'base64');
    const encryptedRsaPrivateKey = Buffer.from(user.encryptedRsaPrivateKey, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', PKEK, privateKeyIv);
    decipher.setAuthTag(privateKeyAuthTag);
    
    rsaPrivateKey = Buffer.concat([decipher.update(encryptedRsaPrivateKey), decipher.final()]).toString('utf8');

    // 5. Symmetric Vault Encryption (ChaCha20-Poly1305)
    const vaultDataString = JSON.stringify(vaultData);
    vaultKey = crypto.randomBytes(32); // Generate a new, single-use 32-byte key
    const vaultNonce = crypto.randomBytes(12); // Generate a new, single-use 12-byte nonce

    const vaultCipher = crypto.createCipheriv('chacha20-poly1305', vaultKey, vaultNonce);
    const encryptedVaultData = Buffer.concat([
        vaultCipher.update(vaultDataString, 'utf8'),
        vaultCipher.final()
    ]);

    // 6. Asymmetric Key Wrapping (Encrypt the ChaCha20 key with RSA)
    const encryptedVaultKey = crypto.publicEncrypt(
        {
            key: user.rsaPublicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        vaultKey // The buffer containing the plaintext ChaCha20 key
    );

    // 7. Persist Encrypted Vault (Create or Update)
    const dataToSave = {
      userId,
      encryptedVaultData: encryptedVaultData.toString('base64'),
      encryptedVaultKey: encryptedVaultKey.toString('base64'),
      vaultNonce: vaultNonce.toString('base64')
    };

    let savedEntry;
    if (vaultId) {
      savedEntry = await Vault.findOneAndUpdate({ _id: vaultId, userId }, { $set: dataToSave }, { new: true });
      if (!savedEntry) {
        return res.status(404).json({ error: 'Vault entry not found or permission denied.' });
      }
    } else {
      const newVault = new Vault(dataToSave);
      savedEntry = await newVault.save();
    }

    res.status(201).json({ 
      message: `Vault entry ${vaultId ? 'updated' : 'saved'} successfully`,
      id: savedEntry._id
    });

  } catch (e) {
    console.error('Save vault error:', e);
    if (e.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    // Catch crypto errors, like a bad auth tag during decryption
    if (e.code && e.code.startsWith('ERR_CRYPTO')) {
        return res.status(401).json({ error: 'Decryption failed. Master password may be incorrect.' });
    }
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  } finally {
    // 8. Memory Cleanup: Securely wipe all sensitive data from memory
    if (PKEK) PKEK.fill(0);
    if (rsaPrivateKey) rsaPrivateKey = null; // Let garbage collector handle the string
    if (vaultKey) vaultKey.fill(0);
  }
}
