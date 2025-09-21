// File: /api/vault/save.js
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

  let PKEK, rsaPrivateKey, vaultKey;

  try {
    await connectDB();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { password, vaultData, id: vaultId } = req.body;
    if (!password || !vaultData) {
      return res.status(400).json({ error: 'Password and vault data are required.' });
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

    const vaultDataString = JSON.stringify(vaultData);
    vaultKey = crypto.randomBytes(32);
    const vaultNonce = crypto.randomBytes(12);

    const vaultCipher = crypto.createCipheriv('chacha20-poly1305', vaultKey, vaultNonce);
    const encryptedVaultData = Buffer.concat([
        vaultCipher.update(vaultDataString, 'utf8'),
        vaultCipher.final()
    ]);
    
    const vaultAuthTag = vaultCipher.getAuthTag(); // NEW: Get the auth tag

    const encryptedVaultKey = crypto.publicEncrypt(
        {
            key: user.rsaPublicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        vaultKey
    );

    const dataToSave = {
      userId,
      encryptedVaultData: encryptedVaultData.toString('base64'),
      encryptedVaultKey: encryptedVaultKey.toString('base64'),
      vaultNonce: vaultNonce.toString('base64'),
      vaultAuthTag: vaultAuthTag.toString('base64') // NEW: Store the auth tag
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
    if (e.code && e.code.startsWith('ERR_CRYPTO')) {
        return res.status(401).json({ error: 'Decryption failed. Password may be incorrect.' });
    }
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  } finally {
    if (PKEK) PKEK.fill(0);
    if (rsaPrivateKey) rsaPrivateKey = null;
    if (vaultKey) vaultKey.fill(0);
  }
});

export default router; // 👈 Export the router