import { app } from '../app.js';
import { connectDB } from '../util/db.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

app.http('profile', {
    methods: ['GET', 'PUT'],
    authLevel: 'anonymous', // Auth is handled by token
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a profile request.');

        try {
            await connectDB();

            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { status: 401, jsonBody: { msg: 'Authorization token is required' } };
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            // --- Handle GET Request: Fetch Profile Data ---
            if (request.method === 'GET') {
                const user = await User.findById(userId).select('-password');
                if (!user) {
                    return { status: 404, jsonBody: { msg: 'User not found' } };
                }
                return { status: 200, jsonBody: { ...user.toObject(), argon2Salt: user.argon2Salt } };
            }

            // --- Handle PUT Request: Update Profile Data ---
            if (request.method === 'PUT') {
                const {
                    fullName,
                    userName,
                    email,
                    mobile,
                    educationalBackground,
                    favoriteSportsTeam,
                    favoriteMovieBook,
                    importantDates,
                    dob,
                    pin,
                    petName,
                    address,
                    masterPassword
                } = await request.json();

                if (!fullName || !userName || !email || !pin) {
                    return { status: 400, jsonBody: { msg: 'Full Name, Username, Email, and PIN are required' } };
                }

                if (!masterPassword) {
                    return { status: 400, jsonBody: { msg: 'Master password is required to update profile.' } };
                }

                const user = await User.findById(userId);
                if (!user) {
                    return { status: 404, jsonBody: { msg: 'User not found' } };
                }

                const isPasswordValid = await user.comparePassword(masterPassword);
                if (!isPasswordValid) {
                    return { status: 401, jsonBody: { msg: 'Invalid master password.' } };
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
                    dob,
                    pin,
                    address,
                    petName,
                    profileInitialized: true
                };

                const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

                if (!updatedUser) {
                    return { status: 404, jsonBody: { msg: 'User not found after update' } };
                }

                return { status: 200, jsonBody: { msg: 'Profile updated successfully' } };
            }
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return { status: 401, jsonBody: { msg: 'Invalid token' } };
            }
            context.error('Profile API error:', error);
            return { status: 500, jsonBody: { msg: 'Server error' } };
        }
    }
});
