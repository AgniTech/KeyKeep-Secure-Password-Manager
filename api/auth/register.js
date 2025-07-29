// /api/auth/register.js
import bcrypt from 'bcryptjs';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log("Incoming request body:", req.body);

  try {
    const { email, password } = req.body;
    console.log("Extracted email:", email);
    console.log("Extracted password:", password);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, masterPassword: hashedPassword }); // ✔ match schema

    await user.save();
    return res.status(201).json({ message: 'User created successfully' });

  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
