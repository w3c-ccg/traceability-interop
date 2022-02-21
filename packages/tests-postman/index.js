#!/usr/bin/env node

import 'dotenv/config';
import { program, Option } from 'commander';
import { readFileSync } from 'fs';
import suite from './lib/index.mjs'; // eslint-disable-line import/extensions

let credentials = JSON.parse(readFileSync('./data/reference-credentials.json'));
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

program
  .addOption(new Option(
    '-c, --credential <name...>',
    'limit tests to specific credentials, can be used more than once',
    'all'
    ).choices([...(credentials.map((p) => p.name)), 'all']).default('all'));

program.parse();

// Testing can be limited to specific providers via command-line options.
const activeProviders = program.opts().provider;
if (!activeProviders.includes('all')) {
  providers = providers.filter((p) => activeProviders.includes(p.name));
}

// Testing can be limited to specific credentials via command-line options.
const activeCredentials = program.opts().credential;
if (!activeCredentials.includes('all')) {
  credentials = credentials.filter((p) => activeCredentials.includes(p.name));
}

const globalNewmanConfig = {
  timeoutRequest: 5000,
  reporters: ['htmlextra']
};

/**
 * createMatrix is a helper function that maps all possible combinations of the
 * input arrays `a` and `b` for use as a test matrix.
 * @param {Array} a
 * @param {Array} b
 */
function createMatrix(a, b) {
  const result = [];
  const left = a || [];
  const right = b || [];
  left.forEach((elA) => {
      right.forEach((elB) => {
           result.push([elA, elB]);
      });
  });
  return result;
}

// Testing Follows
//
// TODO: the tests wired up below are primarily useful for development purposes,
//       we will likely want to do this differently for the final product.

providers.forEach((provider) => {
  const { didWeb, pathPrefix, server } = provider.serviceProvider;

  // Tests grouped by provider can run async
  Promise.resolve()
    .then(async () => {
      // Perform DID Configuration test suite and store `did-configuration.json`
      let didDocument;
      try {
        console.log(didWeb);
        didDocument = await suite.TestDidWebDiscovery(globalNewmanConfig, didWeb);
      } catch (e) {
        console.log(`did configuration failed for ${provider.name}`);
      }

      // Perform Access Token test suite and store access token
      const clientId = provider.oauth2?.clientId;
      const clientSecret = process.env[provider.oauth2?.clientSecret];
      const tokenAudience = provider.oauth2?.tokenAudience;
      const tokenEndpoint = provider.oauth2?.tokenEndpoint;

      let token;
      try {
        token = await suite.TestAccessToken(globalNewmanConfig, clientId, clientSecret, tokenAudience, tokenEndpoint);
      } catch (e) {
        console.log(`access token failed for ${provider.name}`);
      }

      // Issuance, signing, and verification tests are run for each did type
      const promises = [];

      const matrix = createMatrix([...didDocument.alsoKnownAs, didDocument.id], credentials);

      matrix.forEach(([did, data]) => {
        // Log messages need additional data to be relevant.
        const slug = `${did.split(':', 2).join(':')}:${data.name}`;

        // Wrap synchronous test sets in a promise so that sets can run async
        promises.push(Promise.resolve().then(async () => {
          const { credential } = data;
          credential.issuer = did;
          let vc;
          try {
            vc = await suite.TestCredentialsIssue(globalNewmanConfig, token, server, pathPrefix, credential);
          } catch (e) {
            console.log(`${slug}:credentials:issue failed for ${provider.name}`);
          }
          try {
            await suite.TestCredentialsVerify(globalNewmanConfig, token, server, pathPrefix, vc);
          } catch (e) {
            console.log(`${slug}:credentials:verify failed for ${provider.name}`);
          }
          let vp;
          try {
            vp = await suite.TestPresentationsProve(globalNewmanConfig, token, server, pathPrefix, did, vc);
          } catch (e) {
            console.log(`${slug}:presentation:prove failed for ${provider.name}`);
          }
          try {
            await suite.TestPresentationsVerify(globalNewmanConfig, token, server, pathPrefix, vp);
          } catch (e) {
            console.log(`${slug}:presentation:verify test failed for ${provider.name}`);
          }
        }));
      });

      return Promise.all(promises);
    })
    .catch((err) => console.log('there was an error', err));
});
