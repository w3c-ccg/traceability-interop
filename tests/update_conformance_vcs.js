#!/usr/bin/env node
/* eslint-disable no-await-in-loop */
const { CONTEXT_URL, CONTEXT } = require('credentials-context');
const jsonld = require('jsonld');
const { strictDocumentLoader } = require('jsonld-signatures');
const { klona } = require('klona/json');
const fs = require('fs');

// If this changes, the `issuer` in `valid-credential.json` must be updated to
// match. In order for signed credentials to be valid, the controller for a
// verification method must match the credential `issuer`.
const seed = Buffer.from('9b937b81322d816cfab9d5a3baacc9b2');

// suitePromise generates promise that resolves to an Ed25519Signature2018
// signature suite implementation to use for issuing verifiable credentials.
const suitePromise = (async () => {
  const { Ed25519VerificationKey2018 } = await import('@digitalbazaar/ed25519-verification-key-2018');
  const { Ed25519Signature2018 } = await import('@digitalbazaar/ed25519-signature-2018');
  const keyPair = await Ed25519VerificationKey2018.generate({ seed });
  keyPair.id = `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`;
  keyPair.controller = `did:key:${keyPair.fingerprint()}`;
  return new Ed25519Signature2018({ key: keyPair });
})();

// noopMutator returns the input without any mutation.
const noopMutator = (input) => klona(input);

// mutatingDocumentLoader is a document loader implementation that allows mutation of
// the https://www.w3.org/2018/credentials/v1 context via a given mutation
// function.
const mutatingDocumentLoader = async ({ mutate = noopMutator } = {}) => {
  const didKey = await import('@digitalbazaar/did-method-key');

  // The default value is `Ed25519VerificationKey2020`, but we are using the
  // `Ed25519VerificationKey2018` verification suite.
  const didKeyDriver = didKey.driver('Ed25519VerificationKey2018');

  return async (url) => {
    if (url && url.startsWith('did:key')) {
      const document = await didKeyDriver.get({ url });
      return {
        contextUrl: null,
        document,
        documentUrl: url,
        tag: 'static',
      };
    }

    if (url && url === CONTEXT_URL) {
      return {
        contextUrl: null,
        document: mutate(klona(CONTEXT)),
        documentUrl: url,
      };
    }

    if (url && url == 'https://w3id.org/traceability/v1') {
      let context = fs.readFileSync('./traceability-v1.jsonld', 'utf8');
      context = JSON.parse(context);
      return {
        contextUrl: null,
        // Don't mutate traceability context
        document: klona(context),
        documentUrl: url,
      };
    }

    return strictDocumentLoader(url);
  };
};

const addProof = async ({ credentialMutator = noopMutator, contextMutator = noopMutator } = {}) => {
  const suite = await suitePromise;
  const validVC = require('./valid-credential.json');
  const document = credentialMutator(klona(validVC));
  const documentLoader = await mutatingDocumentLoader({ mutate: contextMutator });

  let proof = {
    // Using a specific date allows proof creation to be idempotent.
    created: '2006-01-02T15:04:05Z',
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

const addNegativeTesting = async (suiteJson) => {
  const sampleVCs = new Map();

  {
    const description = 'vc:@context:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc['@context'];
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  {
    const invalidValues = new Map([
      // Some mutations cause errors to be thrown when signing credentials. If a
      // suitable context mutator can be found that will allow these to be signed,
      // it should be implemented and these should be added to the suite. For
      // now, these are left inline to indicate which mutations are outstanding.
      //
      // ['vc:@context:boolean', false],
      // ['vc:@context:integer', 4],
      // ['vc:@context:null', null],
      ['vc:@context:object', { '@vocab': 'https://www.w3.org/2018/credentials/v1/#' }],
      ['vc:@context:string', 'https://www.w3.org/2018/credentials/v1'],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc['@context'] = invalidValue;
        return doc;
      };
      sampleVCs.set(description, await addProof({ credentialMutator }));
    }
  }

  {
    const invalidValues = new Map([
      // Some mutations cause errors to be thrown when signing credentials. If a
      // suitable context mutator can be found that will allow these to be signed,
      // it should be implemented and these should be added to the suite. For
      // now, these are left inline to indicate which mutations are outstanding.
      //
      // ['vc:@context:item:array', ['https://www.w3.org/2018/credentials/v1', []]],
      // ['vc:@context:item:boolean', ['https://www.w3.org/2018/credentials/v1', false]],
      // ['vc:@context:item:integer', ['https://www.w3.org/2018/credentials/v1', 4]],
      // ['vc:@context:item:null', ['https://www.w3.org/2018/credentials/v1', null]],
      [
        'vc:@context:item:object',
        ['https://www.w3.org/2018/credentials/v1', { '@vocab': 'https://www.w3.org/2018/credentials/v1/#' }],
      ],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc['@context'] = invalidValue;
        return doc;
      };
      sampleVCs.set(description, await addProof({ credentialMutator }));
    }
  }

  {
    const description = 'vc:id:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.id;
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  {
    const invalidValues = new Map([
      ['vc:id:array', ['urn:uuid:07aa969e-b40d-4c1b-ab46-ded252003ded']],
      ['vc:id:boolean', false],
      ['vc:id:integer', 123],
      ['vc:id:null', null],
      ['vc:id:object', { key: 'urn:uuid:07aa969e-b40d-4c1b-ab46-ded252003ded' }],
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

      sampleVCs.set(description, await addProof({ credentialMutator, contextMutator }));
    }
  }

  {
    const description = 'vc:type:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.type;
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  {
    const invalidValues = new Map([
      // Some mutations cause errors to be thrown when signing credentials. If a
      // suitable context mutator can be found that will allow these to be signed,
      // it should be implemented and these should be added to the suite. For
      // now, these are left inline to indicate which mutations are outstanding.
      //
      // ['vc:type:boolean', false],
      // ['vc:type:integer', 123],
      // ['vc:type:null', null],
      // ['vc:type:object', { key: 'VerifiableCredential' }],
      ['vc:type:string', 'VerifiableCredential'],
      // ['vc:type:item:array', ['VerifiableCredential', []]],
      // ['vc:type:item:boolean', ['VerifiableCredential', false]],
      // ['vc:type:item:integer', ['VerifiableCredential', 4]],
      // ['vc:type:item:null', ['VerifiableCredential', null]],
      // ['vc:type:item:object', ['VerifiableCredential', { foo: true }]],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.type = invalidValue;
        return doc;
      };
      sampleVCs.set(description, await addProof({ credentialMutator }));
    }
  }

  {
    const description = 'vc:issuer:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.issuer;
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  {
    const invalidValues = new Map([
      ['vc:issuer:array', ['did:example:123']],
      ['vc:issuer:boolean', false],
      ['vc:issuer:integer', 123],
      ['vc:issuer:null', null],
      ['vc:issuer:id:missing', {}],
      ['vc:issuer:id:array', { id: ['did:example:123'] }],
      ['vc:issuer:id:boolean', { id: false }],
      ['vc:issuer:id:integer', { id: 123 }],
      ['vc:issuer:id:null', { id: null }],
      ['vc:issuer:id:object', { id: { key: 'did:example:123' } }],
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

      sampleVCs.set(description, await addProof({ credentialMutator, contextMutator }));
    }
  }

  {
    const description = 'vc:issuanceDate:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.issuanceDate;
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  {
    const invalidValues = new Map([
      ['vc:issuanceDate:array', ['2010-01-01T19:23:24Z']],
      ['vc:issuanceDate:boolean', false],
      ['vc:issuanceDate:integer', 123],
      ['vc:issuanceDate:null', null],
      ['vc:issuanceDate:object', { key: '2010-01-01T19:23:24Z' }],
      ['vc:issuanceDate:string', 'not a valid XML Date Time string'],
    ]);
    for (const [description, invalidValue] of invalidValues) {
      const credentialMutator = (credential) => {
        const doc = klona(credential);
        doc.issuanceDate = invalidValue;
        return doc;
      };
      sampleVCs.set(description, await addProof({ credentialMutator }));
    }
  }

  {
    const description = 'vc:credentialSubject:missing';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      delete doc.credentialSubject;
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  {
    const invalidValues = new Map([
      ['vc:credentialSubject:array', ['did:example:123']],
      ['vc:credentialSubject:boolean', false],
      ['vc:credentialSubject:integer', 123],
      ['vc:credentialSubject:null', null],
      ['vc:credentialSubject:string', 'did:example:123'],
      ['vc:credentialSubject:id:array', { id: ['did:example:123'] }],
      ['vc:credentialSubject:id:boolean', { id: false }],
      ['vc:credentialSubject:id:integer', { id: 123 }],
      ['vc:credentialSubject:id:null', { id: null }],
      ['vc:credentialSubject:id:object', { id: { key: 'did:example:123' } }],
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

      sampleVCs.set(description, await addProof({ credentialMutator, contextMutator }));
    }
  }

  let node = suiteJson.item.find((e) => e.name === 'Credentials - Verify');
  node = node.item.find((e) => e.name === 'Negative Testing');
  node = node.item.find((e) => e.name === 'Bad Request');

  for (const [description, vc] of sampleVCs) {
    const name = `credentials_verify:${description}`;
    const test = node.item.find((e) => e.name === name);
    if (test) {
      const json = JSON.stringify({ verifiableCredential: vc }, null, 4).replace(/[\n]/g, '\n');
      test.request.body.raw = json;
    }
  }
};

const addPositiveTesting = async (suiteJson) => {
  const sampleVCs = new Map();

  {
    const description = 'credentials_verify';
    sampleVCs.set(description, await addProof());
  }

  {
    const description = 'credentials_verify:issuer:object';
    const credentialMutator = (credential) => {
      const doc = klona(credential);
      doc.issuer = { id: doc.issuer };
      return doc;
    };
    sampleVCs.set(description, await addProof({ credentialMutator }));
  }

  let node = suiteJson.item.find((e) => e.name === 'Credentials - Verify');
  node = node.item.find((e) => e.name === 'Positive Testing');

  for (const [description, vc] of sampleVCs) {
    const test = node.item.find((e) => e.name === description);
    if (test) {
      const json = JSON.stringify({ verifiableCredential: vc }, null, 4).replace(/[\n]/g, '\n');
      test.request.body.raw = json;
    }
  }
};

(async () => {
  const suite = require('./conformance_suite.postman_collection.json');

  await addNegativeTesting(suite);
  await addPositiveTesting(suite);

  console.log(JSON.stringify(suite, null, '\t'));
})();
