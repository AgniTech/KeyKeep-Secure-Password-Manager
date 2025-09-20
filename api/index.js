// api/index.js - Main entry point for all API functions

// Import the shared app instance
import { app } from './app.js';

// Import all other function files to register their routes on the shared app
import './auth/login.js';
import './auth/register.js';
import './auth/unlock.js';
import './user/profile.js';
import './user/profile-picture.js';
import './vault/delete.js';
import './vault/fetch.js';
import './vault/get.js';
import './vault/save.js';

// You can still have a root-level function here if you want
app.http('apiIndex', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        return {
            status: 200,
            jsonBody: {
                message: 'KeyKeep API is running. All functions are registered.'
            }
        };
    }
});
