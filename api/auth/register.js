// File: /api/auth/register.js
import bcrypt from 'bcryptjs';
import { connectDB } from '../../backend/util/db.js';
import User from '../../backend/models/user.js';

// Connect to MongoDB once per cold start
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Logging the incoming request
  console.log("Incoming request body:", req.body);

  try {
    const { email, password } = req.body;

    console.log("Extracted email:", email);
    console.log("Extracted password:", password);

    if (!email || !password) {
      console.warn('Email or password missing');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.warn('User already exists:', email);
      return res.status(409).json({ error: 'User already exists' });
    }

   const user = new User({ email, masterPassword: password }); // ✅ use the model's field name
   await user.save();

    console.log('User successfully created:', email);
    return res.status(201).json({ message: 'User created successfully' });

  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
