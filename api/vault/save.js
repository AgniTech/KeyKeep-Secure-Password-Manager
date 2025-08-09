// File: /api/vault/save.js
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import { encryptVaultData } from '../util/encryption.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully for vault save');

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
    console.log('User authenticated:', userId);

    // Validate request data - support both old and new format
    const { 
      site, 
      secret, 
      title, 
      url, 
      username, 
      password, 
      category, 
      notes 
    } = req.body;

    // For backward compatibility, use site/secret if new format not provided
    const credentialTitle = title || site;
    const credentialPassword = password || secret;

    if (!credentialTitle || !credentialPassword) {
      return res.status(400).json({ 
        error: 'Missing required fields: title/site and password/secret are required' 
      });
    }

    console.log('Saving vault entry for:', credentialTitle);

    // Prepare data for encryption
    const vaultData = {
      title: credentialTitle,
      url: url || '',
      username: username || '',
      password: credentialPassword,
      category: category || 'other',
      notes: notes || ''
    };

    // Encrypt sensitive data
    const encryptedData = encryptVaultData(vaultData);

    // Create new vault entry
    const vaultEntry = new Vault({
      userId,
      title: encryptedData.title,
      url: encryptedData.url,
      username: encryptedData.username,
      password: encryptedData.password,
      category: vaultData.category, // Category doesn't need encryption
      notes: encryptedData.notes,
      // Legacy fields for backward compatibility
      site: credentialTitle,
      secret: encryptedData.password
    });

    // Save to database
    const savedEntry = await vaultEntry.save();
    console.log('Vault entry saved successfully:', savedEntry._id);

    res.status(201).json({ 
      message: 'Vault saved successfully',
      id: savedEntry._id
    });
  } catch (e) {
    console.error('Save vault error:', e);
    
    // Provide more specific error messages
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (e.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error: ' + e.message });
    }
    
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
