import { app } from '../app.js';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import libsodium from 'libsodium-wrappers';

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
app.http('profilePicture', {
    methods: ['PUT'],
    authLevel: 'anonymous', // Auth handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a profile picture request.');

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { status: 401, jsonBody: { msg: 'Authorization token is required' } };
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const { profileImage, masterPassword } = await request.json();

            if (!profileImage || !masterPassword) {
                return { status: 400, jsonBody: { msg: 'Profile image data and master password are required.' } };
            }

            const user = await User.findById(userId);
            if (!user) {
                return { status: 404, jsonBody: { msg: 'User not found' } };
            }

            const isPasswordValid = await user.comparePassword(masterPassword);
            if (!isPasswordValid) {
                return { status: 401, jsonBody: { msg: 'Invalid master password.' } };
            }

            if (!user.argon2Salt) {
                return { status: 400, jsonBody: { msg: 'User salt not found. Cannot encrypt profile image.' } };
            }

            const encryptedProfileImage = await encryptWithPassword(profileImage, masterPassword, user.argon2Salt);

            if (!encryptedProfileImage) {
                return { status: 500, jsonBody: { msg: 'Failed to encrypt profile image.' } };
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { profileImage: encryptedProfileImage },
                { new: true }
            );

            if (!updatedUser) {
                return { status: 404, jsonBody: { msg: 'User not found after update' } };
            }

            return { status: 200, jsonBody: { msg: 'Profile picture updated successfully' } };

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return { status: 401, jsonBody: { msg: 'Invalid token' } };
            }
            context.error('Profile picture API error:', error);
            return { status: 500, jsonBody: { msg: 'Server error' } };
        }
    }
});
