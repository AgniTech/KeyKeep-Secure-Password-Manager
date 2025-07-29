// /api/auth/register.js
import bcrypt from 'bcryptjs';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import sodium from 'libsodium-wrappers';

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  await sodium.ready;
  console.log("Incoming request body:", req.body);

  try {
    const { email, masterPassword } = req.body;
    console.log("Extracted email:", email);
    console.log("Extracted password:", masterPassword);

    if (!email || !masterPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 🔥 Create encryption salt
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    const saltBase64 = sodium.to_base64(salt);

    // ✅ Hash password (for login)
    const hashedPassword = await bcrypt.hash(masterPassword, 10);

    const user = new User({
      email,
      masterPassword: hashedPassword,
      encryptionSalt: saltBase64
    });

    await user.save();
    return res.status(201).json({ message: 'User created successfully' });

  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ error: 'Server Error' });
  }
}
