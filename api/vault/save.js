// File: /api/vault/save.js
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import { encryptData } from '../util/encryption.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connectDB();

    const token = req.headers.authorization?.split(' ')[1]; // Expect: Bearer <token>
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { site, secret } = req.body;
    if (!site || !secret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const encrypted = encryptData(secret); // returns { ciphertext, nonce }

    const vaultEntry = new Vault({
      userId,
      site,
      encryptedSecret: encrypted.ciphertext,
      nonce: encrypted.nonce
    });

    await vaultEntry.save();

    res.status(201).json({ message: 'Vault saved successfully' });
  } catch (e) {
    console.error('Save vault error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
