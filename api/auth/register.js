// File: /api/auth/register.js
import { connectDB } from '../../backend/util/db.js';
import User from '../../backend/models/user.js';

// Connect once per cold start
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
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const user = new User({ email });
    user.setPassword(password);
    await user.save();
    return res.status(201).json({ message: 'User created' });
  } catch (e) {
    console.error('Register error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
