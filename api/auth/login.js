// File: /api/auth/login.js
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // The client will send the master password, which we now call 'password' internally
    const { email, password: masterPassword } = req.body;

    if (!email || !masterPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Authenticate User: Find user and verify password
    const user = await User.findOne({ email }).exec();

    if (!user) {
      // Use a generic error message to prevent email enumeration
      return res.status(401).json({ msg: 'Invalid credentials. Please try again.' });
    }

    // The comparePassword method is defined on the User model
    const isMatch = await user.comparePassword(masterPassword);

    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials. Please try again.' });
    }

    // 2. If authentication is successful, generate and return a JWT
    // The JWT proves the user is authenticated for subsequent API calls.
    // It does NOT contain any sensitive key material.
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // Keep session duration reasonable
    );

    return res.status(200).json({ token });

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
}
