// server.js (place this in your project's root directory)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../api/util/db.js'; [cite_start]// [cite: 536]

// --- Import All API Logic as Routers ---
// Note: You must first convert each of these files to export an Express router.
import loginRouter from '../api/auth/login.js'; [cite_start]// [cite: 225]
import registerRouter from '../api/auth/register.js'; [cite_start]// [cite: 243]
import unlockRouter from '../api/auth/unlock.js'; [cite_start]// [cite: 266]
import profileRouter from '../api/user/profile.js'; [cite_start]// [cite: 303]
import deleteVaultRouter from '../api/vault/delete.js'; [cite_start]// [cite: 404]
import fetchVaultRouter from '../api/vault/fetch.js'; [cite_start]// [cite: 424]
import getVaultRouter from '../api/vault/get.js'; [cite_start]// [cite: 459]
import saveVaultRouter from '../api/vault/save.js'; [cite_start]// [cite: 468]


// --- Basic Server Setup ---
dotenv.config(); [cite_start]// [cite: 535]
const app = express(); [cite_start]// [cite: 537]
const PORT = process.env.PORT || 5000; [cite_start]// [cite: 537]


// --- Middleware ---
// Enables your server to accept JSON data and allows cross-origin requests.
app.use(cors()); [cite_start]// [cite: 538]
app.use(express.json()); [cite_start]// [cite: 538]


// --- Database Connection ---
connectDB()
    [cite_start].then(() => console.log('✅ MongoDB connected successfully!')) // [cite: 539]
    .catch(err => {
        [cite_start]console.error('❌ MongoDB connection error:', err); // [cite: 539]
        process.exit(1); [cite_start]// [cite: 539]
    });


// --- API Routes ---
// This is the crucial part that maps your API file logic to a URL path.
app.use('/api/auth/login', loginRouter);
app.use('/api/auth/register', registerRouter);
app.use('/api/auth/unlock', unlockRouter);
app.use('/api/user/profile', profileRouter);
app.use('/api/vault/delete', deleteVaultRouter);
app.use('/api/vault/fetch', fetchVaultRouter);
app.use('/api/vault/get', getVaultRouter);
app.use('/api/vault/save', saveVaultRouter);

// A basic test route to confirm the server is running
app.get('/', (req, res) => {
    [cite_start]res.send('KeyKeep Backend API is running!'); // [cite: 541]
});


// --- Start the Server ---
app.listen(PORT, () => {
    [cite_start]console.log(`🚀 Server is listening on http://localhost:${PORT}`); // [cite: 544]
});