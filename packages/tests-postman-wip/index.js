#!/usr/bin/env node

import 'dotenv/config';
import newman from 'newman';
import { program, Option } from 'commander';
import { readFileSync } from 'fs';

const collection = JSON.parse(readFileSync('./data/Traceability Interoperability.postman_collection.json'));
const credentials = JSON.parse(readFileSync('./data/reference-credentials.json'));
let providers = JSON.parse(readFileSync('./data/service-providers.json'));

program
  .name('npm run test:all')
  .description('Traceability Interoperability Test Runner');

program
  .addOption(new Option(
    '-p, --provider <name...>',
    'limit tests to specific providers, can be used more than once',
    'all'
    ).choices([...(providers.map((p) => p.name)), 'all']).default('all'));

program.parse();

// Testing can be limited to specific providers via command-line options.
const activeProviders = program.opts().provider;
if (!activeProviders.includes('all')) {
  providers = providers.filter((p) => activeProviders.includes(p.name));
}

const globalNewmanConfig = {
  collection,
  timeoutRequest: 5000,
  reporters: ['cli', 'htmlextra', 'json']
};

/**
 * TestAccessToken runs the "Access Token" test suite and returns a promise that
 * resolves to the retrieved access token value.
 * @param {Object} provider - Provider configuration
 * @return {Promise<string>} - A promise that resolves to an access token
 */
function TestAccessToken(clientId, clientSecret, tokenAudience, tokenEndpoint) {
  const newmanConfig = {
    ...globalNewmanConfig,
    envVar: [
      { key: 'CLIENT_ID', value: clientId },
      { key: 'CLIENT_SECRET', value: clientSecret },
      { key: 'TOKEN_AUDIENCE', value: tokenAudience },
      { key: 'TOKEN_ENDPOINT', value: tokenEndpoint },
    ],
    folder: 'Access Token',
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

/**
 * TestDIDConfiguration runs the "DID Configuration" test suite and returns a
 * promise that resolves when the test is complete.
 * @param {string} server - Provider server, e.g., 'vc.mesur.io'
 * @return {Promise<Object>} - A promise that resolves when the test is complete
 */
 function TestDIDConfiguration(server) {
  const newmanConfig = {
    ...globalNewmanConfig,
    envVar: [
      { key: 'server', value: server }
    ],
    folder: 'DID Configuration',
  };
  return new Promise((resolve, reject) => {
    let didConfiguration; // local storage for response value, see below.
    const run = newman.run(newmanConfig, (err, o) => {
      if (err) return reject(err);
      return resolve(didConfiguration);
    });
    run.on('beforeDone', (err, o) => {
      if (err) { reject(err); return; }
      // There should not be iterations for this test, but if there are, they
      // are gracefully handled by taking the last value.
      o.summary.run.executions.forEach((pm) => {
        didConfiguration = pm.response?.json(); // copy to local scope
      });
    });
  });
}

/**
 * Note that this currently runs over a set of iteration data to provide the
 * credentials values.
 *
 * @param {string} accessToken - An OAuth2 bearer token for the provider
 * @param {string} server - Provider base URL, e.g., 'vc.mesur.io'
 * @param {string} pathPrefix - URL path prefix for verifiable credentials, e.g., '/next'
 * @param {string} did - A provider-supported did, e.g., `did:key:XXXXX`
 */
function TestIssueCredentials(accessToken, server, pathPrefix, did) {
  const newmanConfig = {
    ...globalNewmanConfig,
    envVar: [
      { key: 'accessToken', value: accessToken },
      { key: 'server', value: server },
      { key: 'pathPrefix', value: pathPrefix },
      { key: 'did', value: did }
    ],
    folder: 'Issuance',
    iterationData: credentials
  };
  return new Promise((resolve, reject) => {
    let vc; // local storage for response value, see below.
    const run = newman.run(newmanConfig, (err, _) => {
      if (err) console.log(err);
      if (err) return reject(err);
      return resolve(vc);
    });
    run.on('beforeDone', (err, o) => {
      if (err) { reject(err); return; }
      // Access token must be redacted from request headers
      o.summary.run.executions.forEach((pm) => {
        if (pm.request.headers.has('Authorization')) {
          pm.request.headers.upsert({ key: 'Authorization', value: '**REDACTED**' });
        }
        vc = pm.response?.json(); // copy to local scope
      });
    });
  });
}

/**
 *
 * @param {string} accessToken - An OAuth2 bearer token for the provider
 * @param {string} server - Provider base URL, e.g., 'vc.mesur.io'
 * @param {string} pathPrefix - URL path prefix for verifiable credentials, e.g., '/next'
 * @param {string} did - A provider-supported did, e.g., `did:key:XXXXX`
 * @param {string} vc - A verifiable credential
 */
function TestProvePresentations(accessToken, server, pathPrefix, did, vc) {
  const newmanConfig = {
    ...globalNewmanConfig,
    envVar: [
      { key: 'accessToken', value: accessToken },
      { key: 'server', value: server },
      { key: 'pathPrefix', value: pathPrefix },
      { key: 'did', value: did },
      { key: 'verifiableCredential', value: vc },
    ],
    folder: 'Signing'
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

//
// Testing Follows
// TODO: currently one failure halts the whole suite
//
providers.forEach((provider) => {
  const server = provider.serviceProvider?.server;
  const pathPrefix = provider.serviceProvider?.pathPrefix;

  // Tests grouped by provider can run async
  Promise.resolve()
    .then(async () => {
      // Perform DID Configuration test suite and store `did-configuration.json`
      const didConfig = await TestDIDConfiguration(server);

      // Perform Access Token test suite and store access token
      const clientId = provider.oauth2?.clientId;
      const clientSecret = process.env[provider.oauth2?.clientSecret];
      const tokenAudience = provider.oauth2?.tokenAudience;
      const tokenEndpoint = provider.oauth2?.tokenEndpoint;
      const token = await TestAccessToken(clientId, clientSecret, tokenAudience, tokenEndpoint);

      // Issuance, signing, and verification tests are run for each did type
      const promises = [];
      didConfig.linked_dids.map((did) => did.issuer).forEach((did) => {
        // Wrap synchronous test sets in a promise so that sets can run async
        promises.push(Promise.resolve().then(async () => {
          const vc = await TestIssueCredentials(token, server, pathPrefix, did);
          await TestProvePresentations(token, server, pathPrefix, did, vc);
        }));
      });
      return Promise.all(promises);
    })
    .catch((err) => console.log('there was an error', err));
});
