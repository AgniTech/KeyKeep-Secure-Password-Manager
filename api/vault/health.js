import express from 'express';
import { analyzePasswordHealth } from '../util/healthAnalysis.js';

const router = express.Router();

router.post('/', (req, res) => {
    const { credentials, userProfile } = req.body;

    if (!credentials || !Array.isArray(credentials)) {
        return res.status(400).json({ message: 'Invalid request body. "credentials" should be an array.' });
    }

    try {
        const healthReport = analyzePasswordHealth(credentials, userProfile);
        res.json(healthReport);
    } catch (error) {
        console.error('Error analyzing password health:', error);
        res.status(500).json({ message: 'An error occurred during health analysis.' });
    }
});

export default router;
