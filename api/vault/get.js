import { app } from '../app.js';
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import jwt from 'jsonwebtoken';

app.http('getVault', {
    methods: ['GET'],
    authLevel: 'anonymous', // Auth handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a getVault request.');

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { status: 401, jsonBody: { error: 'Unauthorized: No token provided' } };
            }
            const token = authHeader.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const vaultEntries = await Vault.find({ userId }).sort({ createdAt: -1 });

            return { status: 200, jsonBody: { vault: vaultEntries } };
        } catch (e) {
            context.error('Get vault error:', e);
            if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
                return { status: 401, jsonBody: { error: 'Invalid or expired session.' } };
            }
            return { status: 500, jsonBody: { error: 'Server error' } };
        }
    }
});
