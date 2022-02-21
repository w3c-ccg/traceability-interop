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
 * Test runs the "DID Web Discovery" test suite and returns a promise that
 * resolves when the test is complete.
 *
 * @param {newman.NewmanRunOptions} options Newman run options
 * @param {string} didWeb - Provider didWeb, e.g., 'did:web:vc.mesur.io'
 * @return {Promise<Object>} - A promise that resolves when the test is complete
 */
 function Test(options, didWeb) {
  const newmanConfig = {
    ...options,
    collection,
    envVar: [
      { key: 'ORGANIZATION_DID_WEB', value: didWeb }
    ],
  };
  return new Promise((resolve, reject) => {
    let didDocument; // local storage for response value, see below.
    const run = newman.run(newmanConfig, (err, o) => {
      if (err) return reject(err);
      return resolve(didDocument);
    });
    run.on('beforeDone', (err, o) => {
      if (err) { reject(err); return; }
      // There should not be iterations for this test, but if there are, they
      // are gracefully handled by taking the last value.
      o.summary.run.executions.forEach((pm) => {
        // This callback is NOT part of the promise chain, and exceptions must
        // be properly handled here.
        try {
          didDocument = pm.response?.json()?.didDocument; // copy to local scope
        } catch (e) {
          reject(new Error('unable to parse json response'));
        }
      });
    });
  });
}

export default Test;
