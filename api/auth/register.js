// /api/auth/register.js
import crypto from 'crypto';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  // In a real app, you might want to stop the server from starting
  process.exit(1);
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let PKEK, privateKey; // Hold sensitive data for cleanup

  try {
    const { email, password: masterPassword } = req.body;

    if (!email || !masterPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: 'User already exists' });
    }

    // --- Start of New E2EE Registration Logic ---

    // 2. Generate 4096-bit RSA Key Pair
    const { publicKey, privateKey: pk } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });
    privateKey = pk; // Assign to outer scope for cleanup

    // 3. Generate Argon2 Salt (16 bytes)
    const argon2Salt = crypto.randomBytes(16);

    // 4. Derive Private Key Encryption Key (PKEK) from master password
    // This key MUST only exist in memory and is used temporarily to encrypt the RSA private key.
    PKEK = await argon2.hash(masterPassword, {
      salt: argon2Salt,
      raw: true, // Output a raw buffer
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 65536 KiB
      timeCost: 3,
      parallelism: 4,
    });

    // 5. Encrypt the RSA Private Key using AES-256-GCM
    const privateKeyIv = crypto.randomBytes(12); // 12-byte IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', PKEK, privateKeyIv);
    
    const encryptedRsaPrivateKey = Buffer.concat([
      cipher.update(privateKey, 'utf8'),
      cipher.final(),
    ]);
    
    const privateKeyAuthTag = cipher.getAuthTag();

    // 6. Generate Authentication Hash for login verification
    // This is separate from the Argon2 derivation and is used to authenticate the user.
    const bcryptSalt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(masterPassword, bcryptSalt);

    // 7. Persist to Database
    const newUser = new User({
      email,
      password: passwordHash, // The bcrypt hash for authentication
      rsaPublicKey: publicKey, // The public key in PEM format
      // Store all binary data as Base64 strings for DB compatibility
      encryptedRsaPrivateKey: encryptedRsaPrivateKey.toString('base64'),
      privateKeyIv: privateKeyIv.toString('base64'),
      privateKeyAuthTag: privateKeyAuthTag.toString('base64'),
      argon2Salt: argon2Salt.toString('base64'),
    });

    await newUser.save();

    // --- End of New E2EE Registration Logic ---

    return res.status(201).json({
      message: 'User created successfully. Please log in.',
    });

  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ error: 'Server Error' });
  } finally {
    // 8. Memory Cleanup: Overwrite sensitive variables
    if (PKEK) PKEK.fill(0);
    if (privateKey) privateKey = null;
  }
}
