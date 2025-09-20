import { app } from '../app.js';
import crypto from 'crypto';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';

app.http('register', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a registration request.');

        let PKEK, privateKey; // Hold sensitive data for cleanup

        try {
            await connectDB();
            const { email, password } = await request.json();

            if (!email || !password) {
                return {
                    status: 400,
                    jsonBody: { error: 'Email and password are required' }
                };
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return {
                    status: 409,
                    jsonBody: { msg: 'User already exists' }
                };
            }

            const { publicKey, privateKey: pk } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
            });
            privateKey = pk;

            const argon2Salt = crypto.randomBytes(16);

            PKEK = await argon2.hash(password, {
                salt: argon2Salt,
                raw: true,
                type: argon2.argon2id,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 4,
            });

            const privateKeyIv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', PKEK, privateKeyIv);

            const encryptedRsaPrivateKey = Buffer.concat([
                cipher.update(privateKey, 'utf8'),
                cipher.final(),
            ]);

            const privateKeyAuthTag = cipher.getAuthTag();

            const bcryptSalt = await bcrypt.genSalt(12);
            const passwordHash = await bcrypt.hash(password, bcryptSalt);

            const newUser = new User({
                email,
                password: passwordHash,
                rsaPublicKey: publicKey,
                encryptedRsaPrivateKey: encryptedRsaPrivateKey.toString('base64'),
                privateKeyIv: privateKeyIv.toString('base64'),
                privateKeyAuthTag: privateKeyAuthTag.toString('base64'),
                argon2Salt: argon2Salt.toString('base64'),
            });

            await newUser.save();

            return {
                status: 201,
                jsonBody: { message: 'User created successfully. Please log in.' }
            };

        } catch (e) {
            context.error('Registration error:', e);
            return {
                status: 500,
                jsonBody: { error: 'Server Error' }
            };
        } finally {
            if (PKEK) PKEK.fill(0);
            if (privateKey) privateKey = null;
        }
    }
});
