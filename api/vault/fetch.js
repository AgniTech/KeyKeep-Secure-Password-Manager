import { app } from '../app.js';
import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import Vault from '../models/Vault.js';

app.http('fetchVault', {
    methods: ['POST'],
    authLevel: 'anonymous', // Auth handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a fetchVault request.');

        let PKEK, rsaPrivateKey;

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { status: 401, jsonBody: { error: 'Unauthorized: No valid token provided' } };
            }
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const { password } = await request.json();
            if (!password) {
                return { status: 400, jsonBody: { error: 'Password is required.' } };
            }

            const user = await User.findById(userId).exec();
            if (!user) {
                return { status: 404, jsonBody: { error: 'User not found.' } };
            }

            const isAuth = await user.comparePassword(password);
            if (!isAuth) {
                return { status: 401, jsonBody: { error: 'Invalid password.' } };
            }

            const argon2Salt = Buffer.from(user.argon2Salt, 'base64');
            PKEK = await argon2.hash(password, {
                salt: argon2Salt,
                raw: true,
                type: argon2.argon2id,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 4,
            });

            const privateKeyIv = Buffer.from(user.privateKeyIv, 'base64');
            const privateKeyAuthTag = Buffer.from(user.privateKeyAuthTag, 'base64');
            const encryptedRsaPrivateKey = Buffer.from(user.encryptedRsaPrivateKey, 'base64');

            const decipher = crypto.createDecipheriv('aes-256-gcm', PKEK, privateKeyIv);
            decipher.setAuthTag(privateKeyAuthTag);

            rsaPrivateKey = Buffer.concat([decipher.update(encryptedRsaPrivateKey), decipher.final()]).toString('utf8');

            const vaultEntries = await Vault.find({ userId }).sort({ createdAt: -1 }).exec();

            const decryptedEntries = [];
            for (const entry of vaultEntries) {
                let vaultKey = null;
                try {
                    if (!entry.encryptedVaultKey || !entry.vaultNonce || !entry.encryptedVaultData || !entry.vaultAuthTag) {
                        throw new Error('Missing encrypted data components for this entry.');
                    }

                    const encryptedVaultKey = Buffer.from(entry.encryptedVaultKey, 'base64');
                    vaultKey = crypto.privateDecrypt(
                        {
                            key: rsaPrivateKey,
                            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                            oaepHash: 'sha256'
                        },
                        encryptedVaultKey
                    );

                    const vaultNonce = Buffer.from(entry.vaultNonce, 'base64');
                    const encryptedVaultData = Buffer.from(entry.encryptedVaultData, 'base64');
                    const vaultAuthTag = Buffer.from(entry.vaultAuthTag, 'base64');

                    const vaultDecipher = crypto.createDecipheriv('chacha20-poly1305', vaultKey, vaultNonce);
                    vaultDecipher.setAuthTag(vaultAuthTag);

                    const decryptedDataString = Buffer.concat([
                        vaultDecipher.update(encryptedVaultData),
                        vaultDecipher.final()
                    ]).toString('utf8');

                    const decryptedData = JSON.parse(decryptedDataString);
                    decryptedEntries.push({
                        id: entry._id,
                        ...decryptedData
                    });

                } catch (e) {
                    context.log(`Failed to decrypt vault entry ${entry._id}:`, e.message);
                    decryptedEntries.push({
                        id: entry._id,
                        error: 'Failed to decrypt this item.',
                        title: 'Decryption Failed',
                        username: '[Encrypted]',
                        password: '[Encrypted]'
                    });
                } finally {
                    if (vaultKey) vaultKey.fill(0);
                }
            }

            return { status: 200, jsonBody: decryptedEntries };

        } catch (e) {
            context.error('Fetch vault error:', e);
            if (e.name === 'JsonWebTokenError') return { status: 401, jsonBody: { error: 'Invalid token' } };
            if (e.name === 'TokenExpiredError') return { status: 401, jsonBody: { error: 'Token expired' } };
            if (e.code && e.code.startsWith('ERR_CRYPTO')) {
                return { status: 401, jsonBody: { error: 'Decryption failed. Password may be incorrect.' } };
            }
            return { status: 500, jsonBody: { error: 'An unexpected server error occurred.' } };
        } finally {
            if (PKEK) PKEK.fill(0);
            if (rsaPrivateKey) rsaPrivateKey = null;
        }
    }
});
