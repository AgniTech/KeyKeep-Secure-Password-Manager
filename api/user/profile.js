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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // --- Handle GET Request: Fetch Profile Data ---
        if (req.method === 'GET') {
            const user = await User.findById(userId).select('-password'); // Exclude password from result
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }
            return res.status(200).json(user);
        }

        // --- Handle PUT Request: Update Profile Data ---
        if (req.method === 'PUT') {
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
                petName, // Save petName as a top-level field
                profileInitialized: true
            };

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ msg: 'User not found' });
            }

            return res.status(200).json({ msg: 'Profile updated successfully' });
        }

        // If method is not GET or PUT
        return res.status(405).json({ error: 'Method Not Allowed' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        console.error('Profile API error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
}
