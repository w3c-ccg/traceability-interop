const newman = require('newman');

newman.run({
    collection: './docs/tutorials/presentations-verify/presentations-verify.postman_collection.json',
    reporters: ['json', 'htmlextra', 'cli'],
    environment: {
      ORGANIZATION_DID_WEB: process.env.organization_did_web,
      CLIENT_ID: process.env.client_id,
      CLIENT_SECRET: process.env.client_secret,
      TOKEN_AUDIENCE: process.env.token_audience,
      TOKEN_ENDPOINT: process.env.token_endpoint,
      API_BASE_URL: process.env.api_base_url,
    }
}, (err) => {
    if (err) { throw err; }
    console.log('collection run complete!');
});
