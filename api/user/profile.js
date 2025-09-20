import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { encryptWithPassword, decryptWithPassword } from '../util/encryption.js'; // Import new encryption functions

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
            const user = await User.findById(userId).select('-password'); // Exclude hashed password from result
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }
            // Return all fields including the encrypted profileImage and argon2Salt
            return res.status(200).json({ ...user.toObject(), argon2Salt: user.argon2Salt });
        }

        // --- Handle PUT Request: Update Profile Data ---
        if (req.method === 'PUT') {
            const { 
                fullName,
                userName,
                email,
                mobile,
                educationalBackground,
                favoriteSportsTeam,
                favoriteMovieBook,
                importantDates,
                dob, 
                pin, 
                petName, 
                address,
                masterPassword // Master password for encryption/decryption
            } = req.body;

            // Basic validation - adjust as needed for new required fields
            if (!fullName || !userName || !email || !pin) {
                return res.status(400).json({ msg: 'Full Name, Username, Email, and PIN are required' });
            }

            if (!masterPassword) {
                return res.status(400).json({ msg: 'Master password is required to update profile.' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }

            // Verify master password
            const isPasswordValid = await user.comparePassword(masterPassword);
            if (!isPasswordValid) {
                return res.status(401).json({ msg: 'Invalid master password.' });
            }

            const updateData = {
                fullName,
                userName,
                email,
                mobile,
                educationalBackground,
                favoriteSportsTeam,
                favoriteMovieBook,
                importantDates,
                dob,
                pin,
                address,
                petName,
                profileInitialized: true
            };

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ msg: 'User not found after update' });
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