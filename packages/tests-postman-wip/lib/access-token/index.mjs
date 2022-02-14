import { readFileSync } from 'fs';
import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname is not defined in ES module scope
/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable no-underscore-dangle */

const collection = JSON.parse(readFileSync(path.resolve(__dirname, 'postman.json')));

/**
 * TestAccessToken runs the "Access Token" test suite and returns a promise that
 * resolves to the retrieved access token value.
 *
 * @param {newman.NewmanRunOptions} options Newman run options
 * @param {string} clientId OAuth M2M client ID
 * @param {string} clientSecret Oauth M2M client secret
 * @param {string} tokenAudience OAuth token audience
 * @param {string} tokenEndpoint Oauth token endpoint
 * @return {Promise<string>} - A promise that resolves to an access token
 */
function Test(options, clientId, clientSecret, tokenAudience, tokenEndpoint) {
  const newmanConfig = {
    ...options,
    collection,
    envVar: [
      { key: 'CLIENT_ID', value: clientId },
      { key: 'CLIENT_SECRET', value: clientSecret },
      { key: 'TOKEN_AUDIENCE', value: tokenAudience },
      { key: 'TOKEN_ENDPOINT', value: tokenEndpoint },
    ],
  };
  return new Promise((resolve, reject) => {
    let accessToken; // local storage for sensitive value, see below.
    const run = newman.run(newmanConfig, (err, _) => {
      if (err) return reject(err);
      return resolve(accessToken);
    });
    // Sensitive values must be sanitized before test data is persisted by
    // reporters. Any sensitive data points that need to be returned in the
    // resolved promise must be copied into local scope before being redacted.
    run.on('beforeDone', (err, o) => {
      if (err) { reject(err); return; }
      o.summary.run.executions.forEach((pm) => {
        // Token request body may contain sensitive `client_secret` value
        if (pm.request?.body) {
          const req = JSON.parse(pm.request.body);
          req.client_secret = req.client_secret ? '**REDACTED**' : req.client_secret;
          pm.request.body.update(JSON.stringify(req));
        }

        // Token response body may contain sensitive `access_token` value
        if (pm.response?.json()) {
          const res = pm.response.json();
          accessToken = res.access_token; // copy to local scope
          res.access_token = res.access_token ? '**REDACTED**' : res.access_token;
          pm.response.update({ stream: JSON.stringify(res) });
        }
      });
    });
  });
}

export default Test;
