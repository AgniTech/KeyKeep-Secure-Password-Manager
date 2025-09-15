import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { name, dob, pin, petName, address } = req.body;

        // Basic validation
        if (!name || !dob || !pin) {
            return res.status(400).json({ msg: 'Name, DOB, and PIN are required' });
        }

        const updateData = {
            name,
            dob,
            pin,
            address,
            profileInitialized: true
        };

        if (petName) {
            updateData.petName = petName;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json({ msg: 'Profile updated successfully' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        console.error('Profile update error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
}
