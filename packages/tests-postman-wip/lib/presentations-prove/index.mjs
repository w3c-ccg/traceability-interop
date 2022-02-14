import newman from 'newman';

/**
 *
 * @param {newman.NewmanRunOptions} options Newman run options
 * @param {string} accessToken - An OAuth2 bearer token for the provider
 * @param {string} server - Provider base URL, e.g., 'vc.mesur.io'
 * @param {string} pathPrefix - URL path prefix for verifiable credentials, e.g., '/next'
 * @param {string} did - A provider-supported did, e.g., `did:key:XXXXX`
 * @param {string} vc - A verifiable credential
 */
 function Test(options, accessToken, server, pathPrefix, did, vc) {
  const newmanConfig = {
    ...options,
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

export default Test;
