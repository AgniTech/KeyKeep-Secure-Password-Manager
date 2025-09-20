import { app } from '@azure/functions';

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
