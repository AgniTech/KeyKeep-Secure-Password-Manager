import { app } from '../app.js';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

app.http('unlock', {
    methods: ['POST'],
    authLevel: 'anonymous', // Auth is handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed an unlock request.');

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return {
                    status: 401,
                    jsonBody: { error: 'Unauthorized: No token provided' }
                };
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const { masterPassword } = await request.json();
            if (!masterPassword) {
                return {
                    status: 400,
                    jsonBody: { error: 'Password is required' }
                };
            }

            const user = await User.findById(userId);
            if (!user) {
                return {
                    status: 404,
                    jsonBody: { error: 'User not found' }
                };
            }

            const isMatch = await user.comparePassword(masterPassword);
            if (!isMatch) {
                return {
                    status: 401,
                    jsonBody: { error: 'Incorrect master password' }
                };
            }

            return {
                status: 200,
                jsonBody: { message: 'Vault unlocked successfully' }
            };

        } catch (e) {
            context.error('Unlock error:', e);
            if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
                return {
                    status: 401,
                    jsonBody: { error: 'Invalid or expired session. Please log in again.' }
                };
            }
            return {
                status: 500,
                jsonBody: { error: 'Server error' }
            };
        }
    }
});
