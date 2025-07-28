// File: /api/auth/login.js
import { connectDB } from '../backend/util/db.js';
import User from '../backend/models/user.js';

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
    const user = await User.findOne({ email });
    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.status(200).json({ message: 'Login successful' });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
