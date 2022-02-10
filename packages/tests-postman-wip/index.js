#!/usr/bin/env node

import 'dotenv/config';
import newman from 'newman';
import { readFileSync } from 'fs';

const providers = JSON.parse(readFileSync('./data/service-providers.json'));
const collection = JSON.parse(readFileSync('./data/Traceability Interoperability.postman_collection.json'));

const globalNewmanConfig = {
  collection,
  timeoutRequest: 5000,
  reporters: ['cli', 'htmlextra', 'json']
};

/**
 * Convenience definition for postman environment variables
 * @typedef {Array<{ key: string, value: string }>} PostmanEnvironment
 */

/**
 * LoadTestAccessTokenEnvironment returns a PostmanEnvironment for the given
 * provider suitable for use with TestAccessToken(), with the following
 * variables set:
 *
 *   - CLIENT_ID
 *   - CLIENT_SECRET
 *   - TOKEN_AUDIENCE
 *   - TOKEN_ENDPOINT
 *
 * @param {Object} provider - Provider configuration
 * @return {PostmanEnvironment}
 */
function LoadTestAccessTokenEnvironment(provider) {
  return [
    { key: 'CLIENT_ID', value: provider.oauth2?.clientId },
    { key: 'CLIENT_SECRET', value: process.env[provider.oauth2?.clientSecret] },
    { key: 'TOKEN_AUDIENCE', value: provider.oauth2?.tokenAudience },
    { key: 'TOKEN_ENDPOINT', value: provider.oauth2?.tokenEndpoint },
  ];
}

/**
 * TestAccessToken runs the "Access Token" test suite and returns a promise that
 * resolves to the retrieved access token value.
 * @param {Object} provider - Provider configuration
 * @return {Promise<string>} - A promise that resolves to an access token
 */
function TestAccessToken(provider) {
  const newmanConfig = {
    ...globalNewmanConfig,
    envVar: LoadTestAccessTokenEnvironment(provider),
    folder: 'Access Token',
  };
  newmanConfig.collection.info.name = `Access Token [${provider.name}]`;
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

/**
 * LoadTestDIDConfigurationEnvironment returns a PostmanEnvironment for the
 * given provider suitable for use with TestDIDConfiguration(), with the
 * following variables set:
 *
 *   - PROVIDER_BASE_URL
 *
 * @param {Object} provider - Provider configuration
 * @return {PostmanEnvironment}
 */
function LoadTestDIDConfigurationEnvironment(provider) {
  return [{ key: 'PROVIDER_BASE_URL', value: provider.serviceProvider?.baseURL }];
}

/**
 * TestDIDConfiguration runs the "DID Configuration" test suite and returns a
 * promise that resolves when the test is complete.
 * @param {Object} provider - Provider configuration
 * @return {Promise<void>} - A promise that resolves when the test is complete
 */
 function TestDIDConfiguration(provider) {
  const newmanConfig = {
    ...globalNewmanConfig,
    envVar: LoadTestDIDConfigurationEnvironment(provider),
    folder: 'DID Configuration',
  };
  newmanConfig.collection.info.name = `DID Configuration [${provider.name}]`;
  return new Promise((resolve, reject) => {
    newman.run(newmanConfig, (err, sum) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

// Temporarily run synchronously
Promise.resolve()
  .then(() => TestDIDConfiguration(providers[0]))
  .then(() => TestDIDConfiguration(providers[1]))
  .then(() => TestDIDConfiguration(providers[2]))
  .then(() => TestDIDConfiguration(providers[3]))
  .then(() => TestAccessToken(providers[0]))
  .then(() => TestAccessToken(providers[1]))
  .then(() => TestAccessToken(providers[2]))
  .then(() => TestAccessToken(providers[3]))
  .catch((err) => console.log('there was an error'));
