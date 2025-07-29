// File: /api/auth/login.js
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config(); // Load .env vars like JWT_SECRET

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect. Please try again.' });

    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email or password is incorrect. Please try again.' });

    }
    const token = jwt.sign(
      { id: user._id },                // payload
      process.env.JWT_SECRET,          // secret
      { expiresIn: '2h' }              // optional: set expiry
    );
    
    return res.status(200).json({ token });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
