// File: /api/vault/fetch.js

import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await connectDB();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const credentials = await Vault.find({ userId });

    res.status(200).json({ credentials });
  } catch (e) {
    console.error('Fetch vault error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}
