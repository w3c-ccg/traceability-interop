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
 * TestDIDConfiguration runs the "DID Configuration" test suite and returns a
 * promise that resolves when the test is complete.
 *
 * @param {newman.NewmanRunOptions} options Newman run options
 * @param {string} server - Provider server, e.g., 'vc.mesur.io'
 * @return {Promise<Object>} - A promise that resolves when the test is complete
 */
 function Test(options, server) {
  const newmanConfig = {
    ...options,
    collection,
    envVar: [
      { key: 'server', value: server }
    ],
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

export default Test;
