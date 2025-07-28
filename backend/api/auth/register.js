// File: /api/auth/register.js
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
    const user = new User({ email });
    user.setPassword(password);
    await user.save();
    return res.status(201).json({ message: 'User created' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User.js'); // Import the User model

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { email, masterPassword } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with that email already exists' });
        }

        user = new User({
            email,
            masterPassword
        });

        await user.save();

        // Generate JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ msg: 'Registration successful', token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public

module.exports = router;