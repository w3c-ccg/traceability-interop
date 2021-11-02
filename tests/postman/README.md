# Test Examples

This folder contains a newman/postman collection and sample input data required to test issuance of credentials from the traceability vocab against implementations of the VC-API as defined in the traceability interop profile

to execute from CLI:

```shell
newman run ./collections/reference/vc-http-api-supply-chain.json -d ./data/reference/vc-http-api-supply-chain-credentials.json 
```

A variation of this test set will be generalized and extended out to be incorporated into CI / CD for the overal traceability specification objects
 
