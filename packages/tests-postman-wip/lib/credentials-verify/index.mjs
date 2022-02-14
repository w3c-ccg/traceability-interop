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
 * Test `credentials/verify` functionality.
 *
 * @param {newman.NewmanRunOptions} options Newman run options
 * @param {string} accessToken - An OAuth2 bearer token for the provider
 * @param {string} server - Provider base URL, e.g., 'vc.mesur.io'
 * @param {string} pathPrefix - URL path prefix for verifiable credentials, e.g., '/next'
 * @param {Object} jsonData - Verifiable credential
 * @return {Promise<void>} - A promise that resolves when test is complete
 *
 * @TODO Should this return stringified JSON?
 * @TODO This should not use iteration data, only one credential should be provided
 */
 function Test(options, accessToken, server, pathPrefix, jsonData) {
  const newmanConfig = {
    ...options,
    collection,
    envVar: [
      { key: 'accessToken', value: accessToken },
      { key: 'server', value: server },
      { key: 'pathPrefix', value: pathPrefix },
      { key: 'verifiableCredential', value: JSON.stringify(jsonData) }
    ],
  };
  return new Promise((resolve, reject) => {
    const run = newman.run(newmanConfig, (err, _) => {
      if (err) return reject(err);
      return resolve();
    });
    run.on('beforeDone', (err, o) => {
      if (err) { reject(err); return; }
      // Access token must be redacted from request headers
      o.summary.run.executions.forEach((pm) => {
        if (pm.request.headers.has('Authorization')) {
          pm.request.headers.upsert({ key: 'Authorization', value: '**REDACTED**' });
        }
      });
    });
  });
}

export default Test;
