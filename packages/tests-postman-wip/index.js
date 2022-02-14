#!/usr/bin/env node

import 'dotenv/config';
import { program, Option } from 'commander';
import { readFileSync } from 'fs';
import suite from './lib/index.mjs'; // eslint-disable-line import/extensions

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
  timeoutRequest: 5000,
  reporters: ['cli', 'htmlextra', 'json']
};

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
      const didConfig = await suite.TestDidConfiguration(globalNewmanConfig, server);

      // Perform Access Token test suite and store access token
      const clientId = provider.oauth2?.clientId;
      const clientSecret = process.env[provider.oauth2?.clientSecret];
      const tokenAudience = provider.oauth2?.tokenAudience;
      const tokenEndpoint = provider.oauth2?.tokenEndpoint;
      const token = await suite.TestAccessToken(globalNewmanConfig, clientId, clientSecret, tokenAudience, tokenEndpoint);

      // Issuance, signing, and verification tests are run for each did type
      const promises = [];
      didConfig.linked_dids.map((did) => did.issuer).forEach((did) => {
        // Wrap synchronous test sets in a promise so that sets can run async
        promises.push(Promise.resolve().then(async () => {
          const vc = await suite.TestCredentialsIssue(globalNewmanConfig, token, server, pathPrefix, did, credentials);
          await suite.TestCredentialsVerify(globalNewmanConfig, token, server, pathPrefix, JSON.stringify(vc));
          const vp = await suite.TestPresentationsProve(globalNewmanConfig, token, server, pathPrefix, did, vc);
          await suite.TestPresentationsVerify(globalNewmanConfig, token, server, pathPrefix, JSON.stringify(vp));
        }));
      });
      return Promise.all(promises);
    })
    .catch((err) => console.log('there was an error', err));
});
