// File: /api/vault/save.js
import { connectDB } from 'api/backend/util/db.js';
import Vault from 'api/backend/models/Vault.js';
import { encryptData } from 'api/backend/util/encryption.js';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connectDB();

    const { email, site, secret } = req.body;

    if (!email || !site || !secret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const encrypted = encryptData(secret); // returns { ciphertext, nonce }

    const vaultEntry = new Vault({
      email,
      site,
      encryptedSecret: encrypted.ciphertext, // ⬅ match schema
      nonce: encrypted.nonce
    });

    await vaultEntry.save();

    res.status(201).json({ message: 'Vault saved successfully' });
  } catch (e) {
    console.error('Save vault error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
