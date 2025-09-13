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
    // SIMPLIFICATION: Use 'password' consistently. No more renaming.
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).exec();

    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials. Please try again.' });
    }

    // The user model's comparePassword method will compare the provided password
    // with the hash stored in the database.
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials. Please try again.' });
    }

    // If authentication is successful, generate and return a JWT.
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      token,
      profileInitialized: user.profileInitialized
    });

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  }
}
