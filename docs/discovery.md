## Discovery Organization Capabilities from did:web

The purpose of this document is to define the discoverability feature necessary to complete integration tests in postman with authentication.

The current APIs exploit the well known did configuration, which has some limitations, most notably regarding multi-tenant platforms.

This proposal is intended to obsolete the use of Well Known DID Configuration in the current API Tests.

### Assumptions

An organization will have an application authorized to act on their behalf.

The application will be identified with a `CLIENT_ID` which MAY be publically shared.

The application will be authenticated with a `CLIENT_SECRET` which MUST NOT be disclosed.

The organization will have more than one DID.

Each organizatin DID will have DID URLs for `assertionMethod` and `authentication` relationships.

Each DID URL for a given relationship will have a single supported suite type (Ed25519Signature2018, JsonWebSignature2020).

As a representative of an organization, I can discover another organization's supported API features from their `did:web`.

### Proposed Solution

1. Resolve `did:web:platform.example:organization:123`

This is trivial, simply do:

```
HTTP GET https://platform.example/organization/123/did.json => didDocument.json
```

2. Review the `alsoKnownAs` section of the did document.

```json
{
  "alsoKnownAs": [
    "did:example:123",
    "did:key:z6Mk...",
    "did:web:another.platform.example:organization:456"
  ]
}
```

Resolve each of these DIDs.

The set of supported `assertionMethod` DID URLs for the organization is the aggregation of the `assertionMethod` for each listed DID.

The set of supported `authentication` DID URLs for the organization is the aggregation of the `authentication` for each listed DID.

All `Ed25519VerificationKey2018` types support `Ed25519Siganture2018`

All `JsonWebKey2020` types support `JsonWebSignature2020` AND `VC-JWT`.

3. Review the `service` section of the did document.

```json
{
  "id": "did:web:platform.example:organization:123#traceability-api",
  "type": "TraceabilityAPI", // Todo: define this service type in the trace-vocab.
  "serviceEndpoint": "https://platform.example/organization/123"
}
```

This definition implies the following endpoints:

```
https://platform.example/organization/123/credentials/issue
https://platform.example/organization/123/credentials/verify
https://platform.example/organization/123/presentations/prove
https://platform.example/organization/123/presentations/verify
https://platform.example/organization/123/presentations/available
https://platform.example/organization/123/presentations/submissions
```

These endpoints require the application to be authenticated:

```
https://platform.example/organization/123/credentials/issue
https://platform.example/organization/123/presentations/prove
```

These endpoints do not require the application to be authenticated:

```
https://platform.example/organization/123/credentials/verify
https://platform.example/organization/123/presentations/verify
https://platform.example/organization/123/presentations/available
https://platform.example/organization/123/presentations/submissions
```

Implementations are encouraged to require authentication for all endpoints.

Implementations are encouraged to `allow-list` specific DIDs per `CLIENT_ID`.
