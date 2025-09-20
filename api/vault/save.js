import { app } from '../app.js';
import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import Vault from '../models/Vault.js';

app.http('saveVault', {
    methods: ['POST'],
    authLevel: 'anonymous', // Auth handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a saveVault request.');

        let PKEK, rsaPrivateKey, vaultKey;

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { status: 401, jsonBody: { error: 'Unauthorized: No valid token provided' } };
            }
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const { password, vaultData, id: vaultId } = await request.json();
            if (!password || !vaultData) {
                return { status: 400, jsonBody: { error: 'Password and vault data are required.' } };
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

            const vaultDataString = JSON.stringify(vaultData);
            vaultKey = crypto.randomBytes(32);
            const vaultNonce = crypto.randomBytes(12);

            const vaultCipher = crypto.createCipheriv('chacha20-poly1305', vaultKey, vaultNonce);
            const encryptedVaultData = Buffer.concat([
                vaultCipher.update(vaultDataString, 'utf8'),
                vaultCipher.final()
            ]);

            const vaultAuthTag = vaultCipher.getAuthTag();

            const encryptedVaultKey = crypto.publicEncrypt(
                {
                    key: user.rsaPublicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                vaultKey
            );

            const dataToSave = {
                userId,
                encryptedVaultData: encryptedVaultData.toString('base64'),
                encryptedVaultKey: encryptedVaultKey.toString('base64'),
                vaultNonce: vaultNonce.toString('base64'),
                vaultAuthTag: vaultAuthTag.toString('base64')
            };

            let savedEntry;
            if (vaultId) {
                savedEntry = await Vault.findOneAndUpdate({ _id: vaultId, userId }, { $set: dataToSave }, { new: true });
                if (!savedEntry) {
                    return { status: 404, jsonBody: { error: 'Vault entry not found or permission denied.' } };
                }
            } else {
                const newVault = new Vault(dataToSave);
                savedEntry = await newVault.save();
            }

            return {
                status: 201,
                jsonBody: {
                    message: `Vault entry ${vaultId ? 'updated' : 'saved'} successfully`,
                    id: savedEntry._id
                }
            };

        } catch (e) {
            context.error('Save vault error:', e);
            if (e.name === 'JsonWebTokenError') return { status: 401, jsonBody: { error: 'Invalid token' } };
            if (e.name === 'TokenExpiredError') return { status: 401, jsonBody: { error: 'Token expired' } };
            if (e.code && e.code.startsWith('ERR_CRYPTO')) {
                return { status: 401, jsonBody: { error: 'Decryption failed. Password may be incorrect.' } };
            }
            return { status: 500, jsonBody: { error: 'An unexpected server error occurred.' } };
        } finally {
            if (PKEK) PKEK.fill(0);
            if (rsaPrivateKey) rsaPrivateKey = null;
            if (vaultKey) vaultKey.fill(0);
        }
    }
});
