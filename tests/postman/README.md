# Test Examples

This folder contains a newman/postman collection and sample input data required to test issuance of credentials from the traceability vocab against implementations of the VC-API as defined in the traceability interop profile

to execute examples from CLI:

```shell
newman run ./collections/reference/vc-http-api-supply-chain.json -d ./data/reference/vc-http-api-supply-chain-credentials.json 
```

A variation of this test set will be generalized and extended out to be incorporated into CI / CD for the overal traceability specification objects

# Core Profile and Interop Tests

All APIs and configs will be tested with Newman/Postman, and additional settings (security, etc) may be tested with other core system utilities and or JS

This package may be executed with the following:

```bash
node .
```

Which will execute all configured tests via node

## Test folder structure

```
├── bin - binary folder for cli test execution and integration into CI
├── collections - postman collections
│   └── reference - postman examples related to this test suite
└── data - data packages for use with the postman collections
    └── reference - examples
```

The basic test flow is outlined in the below diagram:
![Trace Interop Test Flow](./interop-test-flow.png)


This test suite provides core postman collections for testing on interop that we will begin with are:

- `service-providers.json` : does the service provider meet baseline functionality
- `reference-credentials.json` : can the service provider issue, verify, etc with a known set of good credentials
- `interop-credentials.json` : can the service provider act in all required roles; 1) issuer, 2) verifier, 3) holder, with a known set of credentials from the trace vocab


## Base Service Provider Config and Profile Tests

To execute the base service provider tests from CLI execute the following:

```shell
newman run ./collections/service-providers.json -d ./data/service-providers.json -r html,json[,cli] --reporter-json-export ./newman/service-provider-report.json
```

## Reference Credential and baseline VC-API Tests

To execute the baseline tests against the VC-API from CLI execute the following:

```shell
newman run ./collections/reference-credentials.json -d ./data/reference-credentials.json -r html,json[,cli] --reporter-json-export ./newman/reference-credentials-report.json
```


## Importing Collections into Postman

To import the collections into Postman, follow the guide on [importing Postman data](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/#importing-data-into-postman)