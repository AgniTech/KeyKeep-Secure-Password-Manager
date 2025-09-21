// File: /api/auth/unlock.js
import { Router } from 'express'; // 👈 Import Router
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

const router = Router(); // 👈 Create a new router instance

router.post('/', async (req, res) => { // 👇 Change the handler to a router method (e.g., router.post)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { masterPassword } = req.body;
        if (!masterPassword) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await user.comparePassword(masterPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect master password' });
        }

        res.status(200).json({ message: 'Vault unlocked successfully' });

    } catch (e) {
        console.error('Unlock error:', e);
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

export default router; // 👈 Export the router