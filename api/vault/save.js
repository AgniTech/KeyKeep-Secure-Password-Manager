import { connectDB } from '../../../backend/util/db.js';
import Vault from '../../../backend/models/Vault.js';
import { encryptData } from '../../../backend/util/encryption.js';

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

    const encrypted = encryptData(secret);

    const vaultEntry = new Vault({
      email,
      site,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce
    });

    await vaultEntry.save();

    res.status(201).json({ message: 'Vault saved successfully' });
  } catch (e) {
    console.error('Save vault error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
