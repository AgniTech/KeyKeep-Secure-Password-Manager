import { app } from '@azure/functions';

// Import all other function files to register them with the runtime
import './auth/login.js';
import './auth/register.js';
import './auth/unlock.js';
import './user/profile.js';
import './user/profile-picture.js';
import './vault/delete.js';
import './vault/fetch.js';
import './vault/get.js';
import './vault/save.js';

// This is a simple health-check endpoint for the API root
app.http('apiIndex', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        return {
            status: 200,
            jsonBody: {
                message: 'KeyKeep API is running. Welcome!'
            }
        };
    }
});
