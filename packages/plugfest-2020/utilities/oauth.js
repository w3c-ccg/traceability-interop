const help = require("../help");

/**
 * Performs OAuth2.0 Client Credentials flow to obtain an access token
 * @see https://www.oauth.com/oauth2-servers/access-tokens/client-credentials/
 * @param options 
 */
module.exports.getAccessTokenViaClientCredentials = async ({
    token_endpoint,
    client_id,
    client_secret,
    audience
}) => {
    const result = await help.postJson(token_endpoint, {
        client_id,
        client_secret,
        audience,
        grant_type: "client_credentials"
    });

    return result.body.access_token;
}