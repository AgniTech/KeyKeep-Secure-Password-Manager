import { Router } from 'express'; // 👈 Import Router
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { encryptWithPassword, decryptWithPassword } from '../util/encryption.js'; // Import new encryption functions


const router = Router(); // 👈 Create a new router instance

router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId).select('-password'); // Exclude hashed password from result
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        // Return all fields including the encrypted profileImage and argon2Salt
        return res.status(200).json({ ...user.toObject(), argon2Salt: user.argon2Salt });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        console.error('Profile API error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { 
            fullName,
            userName,
            email,
            mobile,
            educationalBackground,
            favoriteSportsTeam,
            favoriteMovieBook,
            importantDates,
            name, 
            dob, 
            pin, 
            petName, 
            address,
            profileImage, // New field for profile image data
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
            name, 
            dob,
            pin,
            address,
            petName,
            profileInitialized: true
        };

        // Handle profile image encryption/decryption
        if (profileImage !== undefined) { // Check if profileImage was sent in the request body
            if (profileImage === null) {
                updateData.profileImage = null; // Remove profile image
            } else {
                // Encrypt the new profile image using the user's master password and argon2Salt
                const encryptedProfileImage = encryptWithPassword(profileImage, masterPassword, user.argon2Salt);
                if (!encryptedProfileImage) {
                    return res.status(500).json({ msg: 'Failed to encrypt profile image.' });
                }
                updateData.profileImage = encryptedProfileImage;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found after update' });
        }

        return res.status(200).json({ msg: 'Profile updated successfully' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        console.error('Profile API error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

export default router; // 👈 Export the router