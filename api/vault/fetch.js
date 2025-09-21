// File: /api/vault/fetch.js
import { Router } from 'express'; // 👈 Import Router
import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import Vault from '../models/Vault.js';

const router = Router(); // 👈 Create a new router instance

router.post('/', async (req, res) => { // 👇 Change the handler to a router method (e.g., router.post)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let PKEK, rsaPrivateKey;

  try {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isAuth = await user.comparePassword(password);
    if (!isAuth) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const argon2Salt = Buffer.from(user.argon2Salt, 'base64');
    PKEK = await argon2.hash(password, {
        salt: argon2Salt,
        raw: true,
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 4,
    });

    const privateKeyIv = Buffer.from(user.privateKeyIv, 'base64');
    const privateKeyAuthTag = Buffer.from(user.privateKeyAuthTag, 'base64');
    const encryptedRsaPrivateKey = Buffer.from(user.encryptedRsaPrivateKey, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', PKEK, privateKeyIv);
    decipher.setAuthTag(privateKeyAuthTag);
    
    rsaPrivateKey = Buffer.concat([decipher.update(encryptedRsaPrivateKey), decipher.final()]).toString('utf8');

    const vaultEntries = await Vault.find({ userId }).sort({ createdAt: -1 }).exec();

    const decryptedEntries = [];
    for (const entry of vaultEntries) {
      let vaultKey = null;
      try {
        // Defensive checks for missing data from old entries
        if (!entry.encryptedVaultKey || !entry.vaultNonce || !entry.encryptedVaultData || !entry.vaultAuthTag) {
            throw new Error('Missing encrypted data components for this entry.');
        }

        const encryptedVaultKey = Buffer.from(entry.encryptedVaultKey, 'base64');
        vaultKey = crypto.privateDecrypt(
          {
            key: rsaPrivateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          encryptedVaultKey
        );

        const vaultNonce = Buffer.from(entry.vaultNonce, 'base64');
        const encryptedVaultData = Buffer.from(entry.encryptedVaultData, 'base64');
        const vaultAuthTag = Buffer.from(entry.vaultAuthTag, 'base64');

        const vaultDecipher = crypto.createDecipheriv('chacha20-poly1305', vaultKey, vaultNonce);
        vaultDecipher.setAuthTag(vaultAuthTag);

        const decryptedDataString = Buffer.concat([
            vaultDecipher.update(encryptedVaultData),
            vaultDecipher.final()
        ]).toString('utf8');

        const decryptedData = JSON.parse(decryptedDataString);
        decryptedEntries.push({
          id: entry._id,
          ...decryptedData
        });

      } catch (e) {
        console.error(`Failed to decrypt vault entry ${entry._id}:`, e.message);
        decryptedEntries.push({
          id: entry._id,
          error: 'Failed to decrypt this item.',
          title: 'Decryption Failed', // Provide a fallback title for UI
          username: '[Encrypted]', // Fallback for UI
          password: '[Encrypted]' // Fallback for UI
        });
      } finally {
        if (vaultKey) vaultKey.fill(0);
      }
    }

    res.status(200).json(decryptedEntries);

  } catch (e) {
    console.error('Fetch vault error:', e);
    if (e.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    if (e.code && e.code.startsWith('ERR_CRYPTO')) {
        return res.status(401).json({ error: 'Decryption failed. Password may be incorrect.' });
    }
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  } finally {
    if (PKEK) PKEK.fill(0);
    if (rsaPrivateKey) rsaPrivateKey = null;
  }
});

export default router; // 👈 Export the router