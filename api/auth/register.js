// /api/auth/register.js
import { Router } from 'express'; // 👈 Import Router
import crypto from 'crypto';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';


const router = Router(); // 👈 Create a new router instance

router.post('/', async (req, res) => { // 👇 Change the handler to a router method (e.g., router.post)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let PKEK, privateKey; // Hold sensitive data for cleanup

  try {
    // SIMPLIFICATION: Use 'password' consistently. No more renaming to masterPassword.
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: 'User already exists' });
    }

    const { publicKey, privateKey: pk } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });
    privateKey = pk;

    const argon2Salt = crypto.randomBytes(16);

    // Derive PKEK from the user's password
    PKEK = await argon2.hash(password, {
      salt: argon2Salt,
      raw: true,
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 4,
    });

    const privateKeyIv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', PKEK, privateKeyIv);
    
    const encryptedRsaPrivateKey = Buffer.concat([
      cipher.update(privateKey, 'utf8'),
      cipher.final(),
    ]);
    
    const privateKeyAuthTag = cipher.getAuthTag();

    // Generate Authentication Hash from the user's password
    const bcryptSalt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, bcryptSalt);

    const newUser = new User({
      email,
      password: passwordHash, // The bcrypt hash for authentication
      rsaPublicKey: publicKey,
      encryptedRsaPrivateKey: encryptedRsaPrivateKey.toString('base64'),
      privateKeyIv: privateKeyIv.toString('base64'),
      privateKeyAuthTag: privateKeyAuthTag.toString('base64'),
      argon2Salt: argon2Salt.toString('base64'),
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User created successfully. Please log in.',
    });

  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ error: 'Server Error' });
  } finally {
    if (PKEK) PKEK.fill(0);
    if (privateKey) privateKey = null;
  }
});

export default router; // 👈 Export the router