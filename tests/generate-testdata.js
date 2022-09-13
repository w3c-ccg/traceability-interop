#!/usr/bin/env node
/* eslint-disable no-await-in-loop */
const { klona } = require('klona/json');
const jsigs = require('jsonld-signatures');
const jsonld = require('jsonld');

// suitePromise generates promise that resolves to an Ed25519Signature2018
// signature suite implementation to use for issuing verifiable credentials.
const suitePromise = (async () => {
  const { Ed25519VerificationKey2018 } = await import('@digitalbazaar/ed25519-verification-key-2018');
  const { Ed25519Signature2018 } = await import('@digitalbazaar/ed25519-signature-2018');

  const keyPair = await Ed25519VerificationKey2018.generate();
  keyPair.id = `did:key:${keyPair.fingerprint()}#${keyPair.fingerprint()}`;
  keyPair.controller = 'did:key${keyPair.fingerprint()';
  return new Ed25519Signature2018({ key: keyPair });
})();

// documentLoaderPromise generates a promise that resolves to the
// @digitalbazaar/vc default secure document loader implementation.
const documentLoaderPromise = (async () => {
  const vc = await import('@digitalbazaar/vc');
  const { defaultDocumentLoader } = vc;

  // const defaultDocumentLoader = async function documentLoader(url) {
  //   return {
  //     contextUrl: null,
  //     documentUrl: url,
  //     document: require('./context.json'),
  //   };
  // };

  return jsigs.extendContextLoader(defaultDocumentLoader);
})();

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

const addProof = async ({ document }) => {
  const suite = await suitePromise;
  const documentLoader = await documentLoaderPromise;

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
  const baseCredential = require('./base_credential.json');

  // {
  //   const document = klona(baseCredential);
  //   delete document['@context'];
  //   const vc = await addProof({ document });
  //   console.log(JSON.stringify(vc, null, 2));
  // }

  // {
  //   const invalidValues = {
  //     '@context:boolean': false,
  //     '@context:integer': 4,
  //     '@context:null': null,
  //     '@context:object': { '@vocab': 'https://www.w3.org/2018/credentials/v1/#' },
  //     '@context:string': 'https://www.w3.org/2018/credentials/v1',
  //   };
  //   for (const [description, invalidValue] of Object.entries(invalidValues)) {
  //     const document = klona(baseCredential);
  //     document['@context'] = invalidValue;
  //     const vc = await addProof({ document });
  //     console.log(JSON.stringify(vc, null, 2));
  //   }
  // }

  // {
  //   const invalidValues = {
  //     '@context:item:array': ['https://www.w3.org/2018/credentials/v1', []],
  //     '@context:item:boolean': ['https://www.w3.org/2018/credentials/v1', false],
  //     '@context:item:integer': ['https://www.w3.org/2018/credentials/v1', 4],
  //     '@context:item:null': ['https://www.w3.org/2018/credentials/v1', null],
  //     '@context:item:object': ['https://www.w3.org/2018/credentials/v1', { '@vocab': 'https://www.w3.org/2018/credentials/v1/#' }],
  //   };
  //   for (const [description, invalidValue] of Object.entries(invalidValues)) {
  //     const document = klona(baseCredential);
  //     document['@context'] = invalidValue;
  //     const vc = await addProof({ document });
  //     console.log(JSON.stringify(vc, null, 2));
  //   }
  // }

  // {
  //   const invalidValues = {
  //     'id:array': ['urn:uuid:07aa969e-b40d-4c1b-ab46-ded252003ded'],
  //     'id:boolean': false,
  //     'id:integer': 123,
  //     'id:null': null,
  //     'id:object': { key: 'urn:uuid:07aa969e-b40d-4c1b-ab46-ded252003ded' },
  //   };
  //   for (const [description, invalidValue] of Object.entries(invalidValues)) {
  //     const document = klona(baseCredential);
  //     document.id = invalidValue;
  //     const vc = await addProof({ document });
  //     console.log(JSON.stringify(vc, null, 2));
  //   }
  // }

  // {
  //   const document = klona(baseCredential);
  //   delete document.type;
  //   const vc = await addProof({ document });
  //   console.log(JSON.stringify(vc, null, 2));
  // }

  // {
  //   const invalidValues = {
  //     'type:boolean': false,
  //     'type:integer': 123,
  //     'type:null': null,
  //     'type:object': { key: 'VerifiableCredential' },
  //     'type:string': 'VerifiableCredential',
  //     'type:item:array': ['VerifiableCredential', []],
  //     'type:item:boolean': ['VerifiableCredential', false],
  //     'type:item:integer': ['VerifiableCredential', 4],
  //     'type:item:null': ['VerifiableCredential', null],
  //     'type:item:object': ['VerifiableCredential', { foo: true }],
  //   };
  //   for (const [description, invalidValue] of Object.entries(invalidValues)) {
  //     const document = klona(baseCredential);
  //     document.type = invalidValue;
  //     const vc = await addProof({ document });
  //     console.log(JSON.stringify(vc, null, 2));
  //   }
  // }

  {
    const document = klona(baseCredential);
    delete document.issuer;
    const vc = await addProof({ document });
    console.log(JSON.stringify(vc, null, 2));
  }

  {
    const invalidValues = {
      'issuer:array': ['did:example:123'],
      'issuer:boolean': false,
      'issuer:integer': 123,
      'issuer:null': null,
      'issuer:string': 'VerifiableCredential',
      // 'issuer:id:missing': {},
      // 'issuer:id:array': { id: ['did:example:123'] },
      // 'issuer:id:boolean': { id: false },
      // 'issuer:id:integer': { id: 123 },
      // 'issuer:id:null': { id: null },
      // 'issuer:id:object': { id: { key: 'did:example:123' } },
    };
    for (const [description, invalidValue] of Object.entries(invalidValues)) {
      const document = klona(baseCredential);
      document.issuer = invalidValue;
      const vc = await addProof({ document });
      console.log(JSON.stringify(vc, null, 2));
    }
  }

  {
    const document = klona(baseCredential);
    delete document.issuanceDate;
    const vc = await addProof({ document });
    console.log(JSON.stringify(vc, null, 2));
  }

  {
    const invalidValues = {
      'issuanceDate:array': ['2010-01-01T19:23:24Z'],
      'issuanceDate:boolean': false,
      'issuanceDate:integer': 123,
      'issuanceDate:null': null,
      'issuanceDate:object': { key: '2010-01-01T19:23:24Z' },
      'issuanceDate:string': 'not a valid XML Date Time string',
    };
    for (const [description, invalidValue] of Object.entries(invalidValues)) {
      const document = klona(baseCredential);
      document.issuanceDate = invalidValue;
      const vc = await addProof({ document });
      console.log(JSON.stringify(vc, null, 2));
    }
  }

  {
    const document = klona(baseCredential);
    delete document.credentialSubject;
    const vc = await addProof({ document });
    console.log(JSON.stringify(vc, null, 2));
  }

  {
    const invalidValues = {
      'credentialSubject:array': ['did:example:123'],
      'credentialSubject:boolean': false,
      'credentialSubject:integer': 123,
      'credentialSubject:null': null,
      'credentialSubject:string': 'did:example:123',
      // 'credentialSubject:id:array': { id: ['did:example:123'] },
      // 'credentialSubject:id:boolean': { id: false },
      // 'credentialSubject:id:integer': { id: 123 },
      // 'credentialSubject:id:null': { id: null },
      // 'credentialSubject:id:object': { id: { key: 'did:example:123' } },
    };
    for (const [description, invalidValue] of Object.entries(invalidValues)) {
      const document = klona(baseCredential);
      document.credentialSubject = invalidValue;
      const vc = await addProof({ document });
      console.log(JSON.stringify(vc, null, 2));
    }
  }
})();
