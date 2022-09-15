#!/usr/bin/env node
/* eslint-disable no-await-in-loop */
const { CONTEXT_URL, CONTEXT } = require('credentials-context');
const jsonld = require('jsonld');
const { strictDocumentLoader } = require('jsonld-signatures');
const { klona } = require('klona/json');

// suitePromise generates promise that resolves to an Ed25519Signature2018
// signature suite implementation to use for issuing verifiable credentials.
const suitePromise = (async () => {
  const { Ed25519VerificationKey2018 } = await import('@digitalbazaar/ed25519-verification-key-2018');
  const { Ed25519Signature2018 } = await import('@digitalbazaar/ed25519-signature-2018');

  const keyPair = await Ed25519VerificationKey2018.generate();
  keyPair.id = `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`;
  keyPair.controller = `did:key${keyPair.fingerprint()}`;
  return new Ed25519Signature2018({ key: keyPair });
})();

// noopMutator returns the input without any mutation.
const noopMutator = (input) => input;

// mutatingDocumentLoader is a document loader implementation that allows mutation of
// the https://www.w3.org/2018/credentials/v1 context via a given mutation
// function.
const mutatingDocumentLoader = async ({ mutate = noopMutator } = {}) => {
  const document = mutate(CONTEXT);
  return async (documentUrl) => {
    if (documentUrl === CONTEXT_URL) {
      return { contextUrl: null, documentUrl, document };
    }
    return strictDocumentLoader(documentUrl);
  };
};

// w3cDate converts a given date-like argument into W3C datetime format with
// seconds resolution.
const w3cDate = (date) => {
  let d = date;
  if (date === undefined || date === null) {
    d = new Date();
  } else if (typeof date === 'number' || typeof date === 'string') {
    d = new Date(date);
  }
  const str = d.toISOString();
  return `${str.substr(0, str.length - 5)}Z`;
};

const addProof = async ({ credentialMutator = noopMutator, contextMutator = noopMutator } = {}) => {
  const suite = await suitePromise;
  const document = credentialMutator(require('./valid-credential.json'));
  const documentLoader = await mutatingDocumentLoader({ mutate: contextMutator });

  let proof = {
    created: w3cDate(),
    verificationMethod: suite.verificationMethod,
    proofPurpose: 'assertionMethod',
    type: 'Ed25519Signature2018',
  };

  const verifyData = await suite.createVerifyData({
    document,
    proof,
    documentLoader,
  });

  proof = await suite.sign({ verifyData, proof });
  jsonld.addValue(document, 'proof', proof);
  return document;
};

(async () => {
  const sampleVCs = {};

  {
    const description = '@context:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc['@context'];
      return doc;
    };
    sampleVCs[description] = await addProof({ credentialMutator });
  }

  {
    const invalidValues = new Map([
      // ['@context:boolean', false],
      // ['@context:integer', 4],
      // ['@context:null', null],
      ['@context:object', { '@vocab': 'https://www.w3.org/2018/credentials/v1/#' }],
      ['@context:string', 'https://www.w3.org/2018/credentials/v1'],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc['@context'] = invalidValue;
        return doc;
      };
      sampleVCs[description] = await addProof({ credentialMutator });
    }
  }

  {
    const invalidValues = new Map([
      // ['@context:item:array', ['https://www.w3.org/2018/credentials/v1', []]],
      // ['@context:item:boolean', ['https://www.w3.org/2018/credentials/v1', false]],
      // ['@context:item:integer', ['https://www.w3.org/2018/credentials/v1', 4]],
      // ['@context:item:null', ['https://www.w3.org/2018/credentials/v1', null]],
      [
        '@context:item:object',
        ['https://www.w3.org/2018/credentials/v1', { '@vocab': 'https://www.w3.org/2018/credentials/v1/#' }],
      ],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc['@context'] = invalidValue;
        return doc;
      };
      sampleVCs[description] = await addProof({ credentialMutator });
    }
  }

  {
    const invalidValues = new Map([
      ['id:array', ['urn:uuid:07aa969e-b40d-4c1b-ab46-ded252003ded']],
      ['id:boolean', false],
      ['id:integer', 123],
      ['id:null', null],
      ['id:object', { key: 'urn:uuid:07aa969e-b40d-4c1b-ab46-ded252003ded' }],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.id = invalidValue;
        return doc;
      };

      const contextMutator = (context) => {
        // Prevent 'protected term redefinition' error when mutating `id`
        delete context['@context']['@protected'];
        // Change `id` from `@id` to `xsd:string` to allow invalid values.
        context['@context'].VerifiableCredential['@context'].id = 'xsd:string';
        return context;
      };

      sampleVCs[description] = await addProof({ credentialMutator, contextMutator });
    }
  }

  {
    const description = 'type:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.type;
      return doc;
    };
    sampleVCs[description] = await addProof({ credentialMutator });
  }

  {
    const invalidValues = new Map([
      // ['type:boolean', false],
      // ['type:integer', 123],
      // ['type:null', null],
      // ['type:object', { key: 'VerifiableCredential' }],
      ['type:string', 'VerifiableCredential'],
      // ['type:item:array', ['VerifiableCredential', []]],
      // ['type:item:boolean', ['VerifiableCredential', false]],
      // ['type:item:integer', ['VerifiableCredential', 4]],
      // ['type:item:null', ['VerifiableCredential', null]],
      // ['type:item:object', ['VerifiableCredential', { foo: true }]],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.type = invalidValue;
        return doc;
      };

      const contextMutator = (context) => {
        // Prevent 'protected term redefinition' error when mutating `type`
        delete context['@context']['@protected'];
        // Change `type` from `@type` to `xsd:string` to allow invalid values.
        context['@context'].VerifiableCredential['@context'].type = 'xsd:string';
        return context;
      };

      sampleVCs[description] = await addProof({ credentialMutator, contextMutator });
    }
  }

  {
    const description = 'issuer:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.issuer;
      return doc;
    };
    sampleVCs[description] = await addProof({ credentialMutator });
  }

  {
    const invalidValues = new Map([
      ['issuer:array', ['did:example:123']],
      ['issuer:boolean', false],
      ['issuer:integer', 123],
      ['issuer:null', null],
      ['issuer:string', 'VerifiableCredential'],
      ['issuer:id:missing', {}],
      ['issuer:id:array', { id: ['did:example:123'] }],
      ['issuer:id:boolean', { id: false }],
      ['issuer:id:integer', { id: 123 }],
      ['issuer:id:null', { id: null }],
      ['issuer:id:object', { id: { key: 'did:example:123' } }],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.issuer = invalidValue;
        return doc;
      };

      // Context must be mutated to prevent nested `issuer.id` from being
      // treated as a default `@id` element.
      const contextMutator = (context) => {
        context['@context'].VerifiableCredential['@context'].issuer = {
          '@id': 'cred:issuer',
          '@type': '@id',
          '@context': { id: 'xsd:string' },
        };
        return context;
      };

      sampleVCs[description] = await addProof({ credentialMutator, contextMutator });
    }
  }

  {
    const description = 'issuanceDate:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.issuanceDate;
      return doc;
    };
    sampleVCs[description] = await addProof({ credentialMutator });
  }

  {
    const invalidValues = new Map([
      ['issuanceDate:array', ['2010-01-01T19:23:24Z']],
      ['issuanceDate:boolean', false],
      ['issuanceDate:integer', 123],
      ['issuanceDate:null', null],
      ['issuanceDate:object', { key: '2010-01-01T19:23:24Z' }],
      ['issuanceDate:string', 'not a valid XML Date Time string'],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.issuanceDate = invalidValue;
        return doc;
      };
      sampleVCs[description] = await addProof({ credentialMutator });
    }
  }

  {
    const description = 'credentialSubject:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.credentialSubject;
      return doc;
    };
    sampleVCs[description] = await addProof({ credentialMutator });
  }

  {
    const invalidValues = new Map([
      ['credentialSubject:array', ['did:example:123']],
      ['credentialSubject:boolean', false],
      ['credentialSubject:integer', 123],
      ['credentialSubject:null', null],
      ['credentialSubject:string', 'did:example:123'],
      ['credentialSubject:id:array', { id: ['did:example:123'] }],
      ['credentialSubject:id:boolean', { id: false }],
      ['credentialSubject:id:integer', { id: 123 }],
      ['credentialSubject:id:null', { id: null }],
      ['credentialSubject:id:object', { id: { key: 'did:example:123' } }],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.credentialSubject = invalidValue;
        return doc;
      };

      // Context must be mutated to prevent nested `credentialSubject.id` from
      // being treated as a default `@id` element.
      const contextMutator = (context) => {
        context['@context'].VerifiableCredential['@context'].credentialSubject = {
          '@id': 'cred:credentialSubject',
          '@type': '@id',
          '@context': { id: 'xsd:string' },
        };
        return context;
      };

      sampleVCs[description] = await addProof({ credentialMutator, contextMutator });
    }
  }

  console.log(JSON.stringify(sampleVCs, null, 2));
})();
