// File: /api/vault/fetch.js

import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully for vault fetch');

    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    console.log('User authenticated for fetch:', userId);

    // Fetch all vault entries for the user
    const vaultEntries = await Vault.find({ userId }).sort({ updatedAt: -1 });
    console.log(`Found ${vaultEntries.length} vault entries for user`);

    // Decrypt and format the data
    const decryptedEntries = vaultEntries.map(entry => {
      try {
        return {
          id: entry._id,
          title: entry.title || entry.site, // Fallback to legacy field
          url: entry.url || '',
          username: entry.username || '',
          password: entry.password || entry.secret, // Fallback to legacy field
          category: entry.category || 'other',
          notes: entry.notes || '',
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          // Legacy fields for backward compatibility
          site: entry.site || entry.title,
          secret: entry.password || entry.secret
        };
      } catch (decryptError) {
        console.error('Decryption error for entry:', entry._id, decryptError);
        // Return entry with original data if decryption fails
        return {
          id: entry._id,
          title: entry.title || entry.site,
          url: entry.url || '',
          username: entry.username || '',
          password: entry.password || entry.secret,
          category: entry.category || 'other',
          notes: entry.notes || '',
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          site: entry.site,
          secret: entry.secret
        };
      }
    });

    res.status(200).json(decryptedEntries);
  } catch (e) {
    console.error('Fetch vault error:', e);
    
    // Provide more specific error messages
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
