// File: /api/auth/login.js
import { connectDB } from '../backend/util/db.js';
import User from '../backend/models/user.js';

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && user.validatePassword(password)) {
      return res.status(200).json({ message: 'Login successful' });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User.js'); // Import the User model



// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, masterPassword } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await user.comparePassword(masterPassword);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ msg: 'Login successful', token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;