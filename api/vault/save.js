// File: /api/vault/save.js
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import { encryptData } from '../util/encryption.js';
import jwt from 'jsonwebtoken';
import sodium from 'libsodium-wrappers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connectDB();
    await sodium.ready;

    const token = req.headers.authorization?.split(' ')[1]; // Expect: Bearer <token>
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { site, secret, keyBase64, url, username, category, tags, notes } = req.body;
if (!site || !secret || !keyBase64) {
  return res.status(400).json({ error: 'Missing required fields' });
}

const key = sodium.from_base64(keyBase64);
const encrypted = encryptData(key, secret); // Encrypt with user-derived key

const vaultEntry = new Vault({
  userId,
  site,
  encryptedSecret: encrypted.ciphertext,
  nonce: encrypted.nonce,
  url: url || '',
  username: username || '',
  category: category || 'other',
  tags: Array.isArray(tags) ? tags : [],
  notes: notes || ''
});


    await vaultEntry.save();

    res.status(201).json({ message: 'Vault saved successfully' });
  } catch (e) {
    console.error('Save vault error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
