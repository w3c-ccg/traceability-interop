'use strict';

const credentials = require('./credentials');
const verifiable_credentials = require('./verifiable_credentials');
const verifiable_presentations = require('./verifiable_presentations');

module.exports = {
  name: 'Trybe.ID',
  // eslint-disable-next-line max-len
  verify_credential_endpoint: 'https://api.dev.trybe.id/credentials/verify',
  // eslint-disable-next-line max-len
  verify_presentation_endpoint: 'https://api.dev.trybe.id/presentations/verify',
  credentials: [...credentials],
  verifiable_credentials: [...verifiable_credentials],
  verifiable_presentations: [...verifiable_presentations],
  issuers: [
    {
      name: 'DID Key Issuer',
      // eslint-disable-next-line max-len
      endpoint: 'https://api.dev.trybe.id/credentials/issue',
      options: [
        {
          issuer: 'did:key:z6MkgHxqyP3Y8ag2fRpJHZwxwecGFm21usgUyvjfZdfEabdW',
          // eslint-disable-next-line max-len
          assertionMethod: 'did:key:z6MkgHxqyP3Y8ag2fRpJHZwxwecGFm21usgUyvjfZdfEabdW#z6MkgHxqyP3Y8ag2fRpJHZwxwecGFm21usgUyvjfZdfEabdW',
        },
      ],
    },
    {
      name: 'DID Key Issuer #2',
      // eslint-disable-next-line max-len
      endpoint: 'https://api.dev.trybe.id/credentials/issue',
      options: [
        {
          issuer: 'did:key:z6MkhEW14uEk4WMhAtSKk34Sd3ZUwfwvycThYy1maBZmBb7y',
          // eslint-disable-next-line max-len
          assertionMethod: 'did:key:z6MkhEW14uEk4WMhAtSKk34Sd3ZUwfwvycThYy1maBZmBb7y#z6MkhEW14uEk4WMhAtSKk34Sd3ZUwfwvycThYy1maBZmBb7y',
        },
      ],
    },
  ],
};