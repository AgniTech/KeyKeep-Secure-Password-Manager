// File: /api/auth/login.js
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, masterPassword } = req.body;

    if (!email || !masterPassword) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email }).exec(); // ✅ FIXED: Moved up + .exec()

    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect. Please try again.' });
    }

    console.log("Login attempt for:", email);                           
    console.log("User found:", user); // ✅ Works now
    console.log("Password in request:", masterPassword);

    const isMatch = await user.comparePassword(masterPassword);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Email or password is incorrect. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

   return res.status(200).json({
  token,
  salt: user.salt  // ✅ Send the stored salt to frontend
});


  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
