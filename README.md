# Traceability Interoperability Specification

[![Interoperability Report](https://github.com/w3c-ccg/traceability-interop/actions/workflows/interoperability-report.yml/badge.svg)](https://github.com/w3c-ccg/traceability-interop/actions/workflows/interoperability-report.yml)
[![Conformance Report](https://github.com/w3c-ccg/traceability-interop/actions/workflows/conformance-run.yml/badge.svg)](https://github.com/w3c-ccg/traceability-interop/actions/workflows/conformance-run.yml)

## About

This specification describes an enterprise grade HTTP API for leveraging 
[W3C Decentralized Identifiers](https://www.w3.org/TR/did-core/) and 
[W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) with 
[W3C CCG Traceability Vocabulary](https://w3c-ccg.github.io/traceability-vocab/) 
and the [VC API](https://w3c-ccg.github.io/vc-api/) when possible.

We encourage contributions meeting the [Contribution
Guidelines](CONTRIBUTING.md). While we prefer the creation of 
[Issues](https://github.com/w3c-ccg/traceability-interop/issues) and 
[Pull Requests](https://github.com/w3c-ccg/traceability-interop/pulls) in the 
GitHub repository, discussions often occur on the
[public-credentials](http://lists.w3.org/Archives/Public/public-credentials/)
mailing list as well, and at regular public meetings ([see `MEETINGS.md`](./MEETINGS.md)).

## Latest Spec

The current version of the specification can be found at [specification](https://w3id.org/traceability/interoperability/openapi)

## Traceability Interoperability

- [Getting Started](#getting-started)
- [Meetings and Hosting Instructions]('./MEETINGS.md')
- [Latest conformance test suite results](https://w3id.org/traceability/interoperability/reports/conformance)
- [Latest interoperability test suite results](https://w3id.org/traceability/interoperability/reports/interoperability)
- [Historical test suite result archive](https://w3id.org/traceability/interoperability/reports/archive)

## Getting Started



- [To generate a report](./reporting/README.md)
- [To import the OpenAPI specification into Postman](./OPENAPI.md)
- For local development of the specification you will need to run the following: 
  ```
  git clone git@github.com:w3c-ccg/traceability-interop.git
  cd traceability-interop
  npm i
  npm run serve
  ```


## Reference Implementation

To simplify the creation of test vectors for the spec, we intend to provide 
a reference implementation.

This implementation will cover all required AND optional APIs, and will be 
used to ensure no breaking changes are accidentally contributed to the spec.

## Postman Test Suites

To ensure conformance and interoperability, tests are conducted in a manner 
consistent with production environments. We maintain a set of Postman 
collections and client credential configurations containing 
[conformance](./tests) and [interoperability](./docs/tutorials) test suites. 
These tests are executed via GitHub actions, on demand by implementers, and 
on a nightly scheduled basis. Please review the linked documentation for 
instructions on importing these test suites into your own local Postman 
environment.

This approach allows us to test implementations in production with the 
appropriate security and authorization policies in place.

If you would like to register an implementation to be tested against the test 
suite, please 
[review the step-by-step instructions provided here](./environment-setup/README.md).

Test suite registration is required for participation in upcoming technical 
demonstrations with various government and non-government entities related to 
trade and import/export data exchange.

