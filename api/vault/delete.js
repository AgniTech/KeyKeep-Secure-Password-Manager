// File: /api/vault/delete.js
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully for vault delete');

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
    console.log('User authenticated for delete:', userId);

    // Validate request data
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Credential ID is required' });
    }

    // Find and delete the vault entry, ensuring it belongs to the user
    const deletedEntry = await Vault.findOneAndDelete({ _id: id, userId });

    if (!deletedEntry) {
      return res.status(404).json({ error: 'Credential not found or you do not have permission to delete it.' });
    }

    console.log('Vault entry deleted successfully:', id);
    res.status(200).json({ message: 'Credential deleted successfully' });

  } catch (e) {
    console.error('Delete vault error:', e);
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (e.name === 'CastError') { // Mongoose throws this for invalid ObjectId format
      return res.status(400).json({ error: 'Invalid credential ID format' });
    }
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
}