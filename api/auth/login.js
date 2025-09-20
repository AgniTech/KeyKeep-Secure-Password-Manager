import { app } from '@azure/functions';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a login request.');

        try {
            await connectDB();
            const { email, password } = await request.json();

            if (!email || !password) {
                return {
                    status: 400,
                    jsonBody: { error: 'Email and password are required' }
                };
            }

            const user = await User.findOne({ email }).exec();

            if (!user) {
                return {
                    status: 401,
                    jsonBody: { msg: 'Invalid credentials. Please try again.' }
                };
            }

            const isMatch = await user.comparePassword(password);

            if (!isMatch) {
                return {
                    status: 401,
                    jsonBody: { msg: 'Invalid credentials. Please try again.' }
                };
            }

            const token = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );

            return {
                status: 200,
                jsonBody: {
                    token,
                    profileInitialized: user.profileInitialized
                }
            };

        } catch (e) {
            context.error('Login error:', e);
            return {
                status: 500,
                jsonBody: { error: 'An unexpected error occurred. Please try again later.' }
            };
        }
    }
});
