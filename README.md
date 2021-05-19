# Traceability Interop Profile

An Profile supporting interop through use of enterprise grade HTTP APIs for leveraging [W3C Decentralized Identifiers](https://www.w3.org/TR/did-core/) and [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) with [W3C CCG Traceability Vocabulary](https://w3c-ccg.github.io/traceability-vocab/).

## [Open API Specification](https://or13.github.io/traceability-api/)

The spec contains documentation on use cases as well are required and optional API operations.

## Reference Implementation

In order to simplify the creation of test vectors for the spec, we intend to provide a reference implementation.

This implementation will cover all required AND optional APIs and will be used to ensure no breaking changes are accidentaly contributed to the spec.

## Postman Interoperability Test Suite

In order to ensure interoperability tests are conducted in a manner consistent with production environments, we will be maintaining postman collections and client credential configuration in github actons.

This will allow us to test implementations in production with the appropriate security and authorizaton policies in place.
