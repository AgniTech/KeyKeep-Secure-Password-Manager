import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import libsodium from 'libsodium-wrappers';

dotenv.config();

// --- Libsodium Encryption Helpers ---
async function getLibsodium() {
    await libsodium.ready;
    return libsodium;
}

const OPSLIMIT = libsodium.crypto_pwhash_OPSLIMIT_MODERATE;
const MEMLIMIT = libsodium.crypto_pwhash_MEMLIMIT_MODERATE;
const ALG = libsodium.crypto_pwhash_ALG_ARGON2ID13;

async function deriveKeyFromPassword(password, salt) {
    const sodium = await getLibsodium();
    const passwordBytes = Buffer.from(password, 'utf8');
    const saltBytes = Buffer.from(salt, 'base64');

    return sodium.crypto_pwhash(
        sodium.crypto_aead_aes256gcm_KEYBYTES,
        passwordBytes,
        saltBytes,
        OPSLIMIT,
        MEMLIMIT,
        ALG
    );
}

async function encryptWithPassword(plaintext, password, salt) {
    if (!plaintext) return null;
    try {
        const sodium = await getLibsodium();
        const key = await deriveKeyFromPassword(password, salt);
        const nonce = sodium.randombytes_buf(sodium.crypto_aead_aes256gcm_NPUBBYTES);

        const encrypted = sodium.crypto_aead_aes256gcm_encrypt(
            plaintext,
            null,
            nonce,
            key
        );

        const nonceB64 = sodium.to_base64(nonce, libsodium.base64_variants.ORIGINAL);
        const encryptedB64 = sodium.to_base64(encrypted, libsodium.base64_variants.ORIGINAL);

        return `${nonceB64}:${encryptedB64}`;
    } catch (error) {
        console.error('Encryption with password failed:', error);
        return null;
    }
}

// --- API Handler ---
export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    await connectDB().catch(err => {
        console.error('MongoDB connection error:', err);
        return res.status(500).json({ msg: 'Database connection failed' });
    });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Authorization token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { profileImage, masterPassword } = req.body;

        if (!profileImage || !masterPassword) {
            return res.status(400).json({ msg: 'Profile image data and master password are required.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isPasswordValid = await user.comparePassword(masterPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ msg: 'Invalid master password.' });
        }

        if (!user.argon2Salt) {
            return res.status(400).json({ msg: 'User salt not found. Cannot encrypt profile image.' });
        }

        const encryptedProfileImage = await encryptWithPassword(profileImage, masterPassword, user.argon2Salt);

        if (!encryptedProfileImage) {
            return res.status(500).json({ msg: 'Failed to encrypt profile image.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profileImage: encryptedProfileImage },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found after update' });
        }

        return res.status(200).json({ msg: 'Profile picture updated successfully' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        console.error('Profile picture API error:', error);
        res.status(500).json({ msg: 'Server error' });
    }
}
