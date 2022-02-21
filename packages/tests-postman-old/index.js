#!/usr/bin/env node
import { program, Option } from 'commander';
import https from 'https';
import newman from 'newman';
import isUrl from 'is-url-superb';
import ky from 'ky-universal';
import fs from 'fs';

console.log('Traceability Interop Testing');

program.version('0.0.1');
program.name('trace-interop-test');

program
  .option(
    '-s, --service <file>',
    'use the specified service provider test collection',
    './collections/service-providers.json'
  )
  .option(
    '-r, --reference <file>',
    'use the specified reference VC test collection',
    './collections/reference-credentials.json'
  );

program
  .option(
    '-sd, --servicedata <file>',
    'use the specified service provider data collection',
    './data/service-providers.json'
  )
  .option(
    '-rd, --referencedata <file>',
    'use the specified reference VC data collection',
    './data/reference-credentials.json'
  );

program.option('-rd, --reportdir <folder>', 'use the specified service provider data collection', './newman');
program.addOption(
  new Option('-t, --tests <all...>', 'use the specified tests, "none" is provided as an option for dev purposes')
    .choices(['all', 'service', 'reference', 'interop', 'none'])
    .default(['all'])
);
program.addOption(
  new Option('-d, --dids <key, web, all...>', 'use the specified did methods')
    // .choices(['key', 'web', 'all'])
    .default(['key'])
);
program.addOption(
  new Option('-n, --names <all...>', 'test only the service provider as identified by name').default(['all'])
);

program.option('-v, --verbose', 'verbose reporting').option('-dev, --dev', 'dev mode for advanced options');

program.parse();

const outputReporters = ['json', 'htmlextra'];

if (program.opts().verbose) {
  outputReporters.push('cli');
}
if (program.opts().dev) {
  console.log('*** DEV MODE SET ***');
}

const serviceCollection = JSON.parse(fs.readFileSync(program.opts().service, 'utf8'));
const serviceData = JSON.parse(fs.readFileSync(program.opts().servicedata, 'utf8'));
const referenceCollection = JSON.parse(fs.readFileSync(program.opts().reference, 'utf8'));
const referenceData = JSON.parse(fs.readFileSync(program.opts().referencedata, 'utf8'));

function getServiceIdx(name) {
  return serviceData.findIndex((obj) => obj.name === name);
}

/**
 * Convenience definition documents the contents of an OAuth2Config object
 * @typedef {Object} OAuth2Config
 * @property {string} access_token_url    - Oauth2 token URL
 * @property {string} client_id           - Oauth2 client ID
 * @property {string} client_secret       - Oauth2 client secret
 * @property {Object} [custom_parameters] - Oauth2 optional custom parameters, e.g., scope, audience, etc.
 */

/**
 * Retrieve OAuth 2.0 configuration parameters for the named provider
 *
 * The `client_id` and `access_token_url` are read from the provider config. The
 * `client_secret` is read from the runtime environment and is expected to be
 * set in a variable named `CLIENT_SECRET_<key>` where `<key>` is the SHA256
 * hash of the `client_id`.
 *
 * @param {string} name - service provider name
 * @return {OAuth2Config} an OAuth2Config instance
 * @throws if service provider name is invalid
 * @throws if service provider oauth2 config is incomplete
 */
function getOAuth2Config(name) {
  const serv = serviceData[getServiceIdx(name)];
  if (typeof serv === 'undefined') {
    throw Error(`"${name}" is not a valid service name`);
  }
  const { access_token_url: tokenURL, client_id: clientID, client_secret_envvar: key } = serv.oauth2 || {};
  if (typeof tokenURL === 'undefined') {
    throw Error(`"${name}" oauth2 configuration is missing "access_token_url" value`);
  }
  if (typeof clientID === 'undefined') {
    throw Error(`"${name}" oauth2 configuration is missing "client_id" value`);
  }
  if (typeof key === 'undefined') {
    throw Error(`"${name}" oauth2 configuration is missing "client_secret_envvar" value`);
  }
  serv.oauth2.client_secret = process.env[key];
  if (typeof serv.oauth2.client_secret === 'undefined') {
    throw Error(`"client_secret" is missing from runtime environment for "${name}"`);
  }
  return serv.oauth2;
}

/**
 * Retrieve an Oauth 2.0 bearer token
 *
 * Token is retrieved using client credentials grant type.
 *
 * @param {string} name service provider name
 * @return {Promise<string>} an opaque access token
 * @throws if oauth2 parameters are not available
 * @throws if there is an error retrieving the bearer token
 */
async function getBearerToken(name) {
  const params = getOAuth2Config(name);
  return ky
    .post(params.access_token_url, {
      json: {
        grant_type: 'client_credentials',
        client_id: params.client_id,
        client_secret: params.client_secret,
        ...params.custom_parameters,
      },
    })
    .json()
    .then((res) => res.access_token);
}

const urlExist = async (url) => {
  if (typeof url !== 'string') {
    // console.log(url, 'not string!');
    throw new TypeError(`Expected a string, got ${typeof url}`);
  }

  if (!isUrl(url)) {
    // console.log(url, 'not url!');
    return false;
  }

  const response = await ky.head(url, {
    throwHttpErrors: false,
  });

  // console.log(url, 'response:', response.status);
  // return response !== undefined && (response.status < 400 || response.status >= 500)
  return response !== undefined && response.status < 500; // using lt 500 to work around some issues on .well-known
};

// run a base sanity check...
async function livenessCheck() {
  console.log('Quick liveness tests on service providers...');

  const { names } = program.opts();
  const services = serviceData.filter((serv) => names.includes('all') || names.includes(serv.name));

  const results = [];

  for (const serv of services) {
    console.log('Checking', serv.name);

    const urlSVC = serv.serviceProvider.provider.url;
    const urlDID = `https://${serv.serviceProvider.baseURL}/.well-known/did-configuration.json`;

    results.push(Promise.all([urlExist(urlSVC), urlExist(urlDID)])
    .then(([svcExists, didExists]) => {
      console.log('\t', serv.serviceProvider.provider.url, svcExists);
      console.log('\t', `https://${serv.serviceProvider.baseURL}/.well-known/did-configuration.json`, didExists);
      if (svcExists && didExists) {
        serviceData[getServiceIdx(serv.name)].live = true;
        console.log(' *', serv.name, 'is alive.');
      } else {
        serviceData[getServiceIdx(serv.name)].live = false;
        console.log(' * ERR:', serv.name, 'is not alive!');
      }
    })
    .then(() => {
      console.log(`obtaining oauth2 client_credentials token for ${serv.name}`);
      return getBearerToken(serv.name);
    })
    .then((token) => {
      serviceData[getServiceIdx(serv.name)].oauth2.token = token;
    })
    .catch((err) => {
      console.error(`unable to obtain token for ${serv.name}:`, err.message);
    }));
  }

  return Promise.all(results);
}

// TODO: set reporter templates for htmlextra

// first setup and run base service provider validation
// TODO: add collection check to skip iter data if server is not alive since we know it will fail
async function spCheck() {
  if (program.opts().tests.includes('all') || program.opts().tests.includes('service')) {
    newman.run(
      {
        collection: serviceCollection,
        iterationData: serviceData,
        reporters: outputReporters,
        reporter: {
          json: { export: `${program.opts().reportdir}/service-provider-report.json` },
          htmlextra: { export: `${program.opts().reportdir}/service-provider-report.html` },
        },
      },
      (err) => {
        if (err) {
          throw err;
        }
        console.log('Traceability Interop: Service Provider test complete');
      }
    );
  }
}

async function testServiceProviderReference(serv) {
  if (program.opts().verbose) console.log(serv);
  if (!serviceData[getServiceIdx(serv.name)].live) {
    console.log('Skipping', serv.name);
    return;
  }

  // get did from .well-known
  const didConfigURL = `https://${serv.serviceProvider.baseURL}/.well-known/did-configuration.json`;
  if (program.opts().verbose) console.log('Testing did-config:', didConfigURL);

  https
    .get(didConfigURL, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const didConfig = JSON.parse(body);
          if (program.opts().verbose) console.log(didConfig);

          // Unless options specify that all dids are to be used, only those
          // specified did methods should be in play.
          const didOpts = program.opts().dids;
          const dids = didConfig.linked_dids.filter((did) => {
            const didMethod = did.issuer.split(':')[1];
            return didOpts.includes('all') || didOpts.includes(didMethod);
          });

          // loop each provided did
          for (const did of dids) {
            const didMethod = did.issuer.split(':')[1];

            const jsonReportFile = `${program.opts().reportdir}/${
              serv.serviceProvider.baseURL
            }/${didMethod}-reference-credentials-report.json`;
            const htmlReportFile = `${program.opts().reportdir}/${
              serv.serviceProvider.baseURL
            }/${didMethod}-reference-credentials-report.html`;

            const run = newman.run(
              {
                collection: referenceCollection,
                iterationData: referenceData,
                reporters: outputReporters,
                reporter: {
                  json: { export: jsonReportFile },
                  htmlextra: { export: htmlReportFile },
                },
                envVar: [
                  { key: 'name', value: serv.name },
                  { key: 'server', value: serv.serviceProvider.baseURL },
                  { key: 'prefix', value: serv.serviceProvider.vcPrefix },
                  { key: 'did', value: did.issuer },
                  { key: 'token', value: serv.oauth2?.token },
                ],
              },
              (err) => {
                if (err) {
                  throw err;
                }
              }
            );

            // Summary must be sanitized before reporters listening for `beforeDone`
            // events run.
            run.on('beforeDone', (err, o) => {
              if (err) {
                return;
              }

              // Access token must be redacted from environment
              if (o.summary.environment.has('token')) {
                o.summary.environment.set('token', '**REDACTED**');
              }

              // Access token must be redacted from request headers
              o.summary.run.executions.forEach((pm) => {
                if (pm.request.headers.has('Authorization')) {
                  pm.request.headers.upsert({ key: 'Authorization', value: '**REDACTED**' });
                }
              });
            });
            console.log('Traceability Interop: Reference Credential test complete:', serv.name, '  did:', didMethod);
          }
        } catch (error) {
          console.error(error.message);
          serviceData[getServiceIdx(serv.name)].live = false;
        }
      });
    })
    .on('error', (error) => {
      console.error(error.message);
      serviceData[getServiceIdx(serv.name)].live = false;
    });
}

// then run reference checks (this should loop each server from the service provider collection )
async function refChecks() {
  const results = [];
  if (program.opts().tests.includes('all') || program.opts().tests.includes('reference')) {
    // loop each service provider
    for (const serv of serviceData) {
      results.push(testServiceProviderReference(serv));
    }
    console.log('Traceability Interop: Reference Credential tests complete');
  }
  return Promise.all(results);
}

// actually run the tests
console.log('Liveness check starting...');
livenessCheck()
  .then(() => {
    console.log('Liveness check complete.\n');
    return Promise.all([spCheck(), refChecks()]);
  })
  .catch((err) => console.log(err));
