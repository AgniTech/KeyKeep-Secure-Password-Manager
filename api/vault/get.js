// File: /api/vault/get.js
import { Router } from 'express'; // 👈 Import Router
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import jwt from 'jsonwebtoken';

const router = Router(); // 👈 Create a new router instance

router.get('/', async (req, res) => { // 👇 Change the handler to a router method (e.g., router.get)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const vaultEntries = await Vault.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ vault: vaultEntries });
  } catch (e) {
    console.error('Get vault error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; // 👈 Export the router