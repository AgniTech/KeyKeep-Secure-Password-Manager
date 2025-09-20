import { app } from '@azure/functions';
import { connectDB } from '../util/db.js';
import Vault from '../models/Vault.js';
import jwt from 'jsonwebtoken';

app.http('deleteVault', {
    methods: ['POST'],
    authLevel: 'anonymous', // Auth handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a deleteVault request.');

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { status: 401, jsonBody: { error: 'Unauthorized: No valid token provided' } };
            }

            const token = authHeader.split(' ')[1];
            if (!process.env.JWT_SECRET) {
                context.error('JWT_SECRET not configured');
                return { status: 500, jsonBody: { error: 'Server configuration error' } };
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const { id } = await request.json();
            if (!id) {
                return { status: 400, jsonBody: { error: 'Credential ID is required' } };
            }

            const deletedEntry = await Vault.findOneAndDelete({ _id: id, userId });

            if (!deletedEntry) {
                return { status: 404, jsonBody: { error: 'Credential not found or you do not have permission to delete it.' } };
            }

            context.log('Vault entry deleted successfully:', id);
            return { status: 200, jsonBody: { message: 'Credential deleted successfully' } };

        } catch (e) {
            context.error('Delete vault error:', e);
            if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
                return { status: 401, jsonBody: { error: 'Invalid or expired token' } };
            }
            if (e.name === 'CastError') {
                return { status: 400, jsonBody: { error: 'Invalid credential ID format' } };
            }
            return { status: 500, jsonBody: { error: 'Server error: ' + e.message } };
        }
    }
});
