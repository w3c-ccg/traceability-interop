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
mailing list as well, and at regular public meetings ([see below](#meetings)).

## Latest Spec

<https://w3id.org/traceability/interoperability/openapi>

## Traceability Interoperability

- [Latest conformance test suite results](https://w3id.org/traceability/interoperability/reports/conformance)
- [Latest interoperability test suite results](https://w3id.org/traceability/interoperability/reports/interoperability)
- [Historical test suite result archive](https://w3id.org/traceability/interoperability/reports/archive)
- [Getting Started](https://github.com/w3c-ccg/traceability-interop/tree/main/reporting)


## Meetings

Meetings are held

- Tuesdays at [13:30 ET/10:30 PT](http://www.timebie.com/std/newyork.php?q=13.5)
- Via [Jitsi](https://github.com/jitsi) in browser or 
  [standalone app](https://github.com/jitsi/jitsi-meet-electron/releases) 
- using this link: [meet.w3c-ccg.org/traceability](https://meet.w3c-ccg.org/traceability)
- With standing agenda to review open Pull Requests 
  ([trace-interop](https://github.com/w3c-ccg/traceability-interop/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-asc), 
  [trace-vocab](https://github.com/w3c-ccg/traceability-vocab/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-asc)),
  then open Issues 
  ([trace-interop](https://github.com/w3c-ccg/traceability-interop/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc), 
  [trace-vocab](https://github.com/w3c-ccg/traceability-vocab/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc)), 
  unless otherwise noted on the [mailing list](https://lists.w3.org/Archives/Public/public-credentials/)

Historical archives for meetings [can be found here](https://github.com/w3c-ccg/meetings).

### Hosting instructions

Any chair, editor, or other party authorized by CCG to manage recordings and
minutes can do the following.

#### Before the Meeting

- Duplicate the 
  [W3C-CCG Traceability Agenda Email Draft](https://docs.google.com/document/d/1Se_PIZNhIzZrwVftbYi-Z3oEMXvucQ7jNjxzjMVWCm4/edit) 
  in Google Docs
- Update all the items highlighted in yellow, in particular adding new agenda 
  items for week starting with item 6.
- If there are presentation materials, add them to the appropriate 
  [dated meeting archives folder](https://github.com/w3c-ccg/meetings/) 
  before the meeting.
- Send agenda to public-credentials@w3.org before each meeting. Use the 
  following format for the subject (modify date accordingly):
  ```
  [AGENDA] W3C CCG Traceability Call - 2022-11-22
  ```
- Confirm in the 
  [CCG mail archives](https://lists.w3.org/Archives/Public/public-credentials/) 
  that the agenda was sent correctly

#### During the Meeting
- Be sure to click **`Start Recording`** and then **`Stop Subtitles`**
- Make sure to link to the agenda at the beginning of the meeting (`Agenda: ...`)
- Make sure the scribe is identified (`Scribe: ...` or `scribe+ ...` 
  identifying someone else, or `scribe+` identifying oneself). Scribes, please 
  familiarize yourself with general scribing guidance 
  [here](https://www.w3.org/2008/04/scribe.html) and 
  [here](https://www.w3.org/2008/xmlsec/Group/Scribe-Instructions.html).
- Make sure topics are labeled when the topic changes (`Topic: ...`)
- Make sure that action items are listed so that they can be added to issues 
  later ("Action: ...")

#### After the Meeting
- Kick everyone from the meeting, and click **`Stop Recording`**
- [Publish the minutes](https://github.com/w3c-ccg/traceability-interop/tree/main/docs/weekly-minutes)

## [Open API Specification](https://w3c-ccg.github.io/traceability-interop/)

The spec contains documentation on use cases as well as required and optional 
API operations.

### Included scripts for managing OpenAPI Specification

1. `npm run validate-spec`: This command can be used to validate the 
   `openapi.yml` spec, ensuring there are no issues.
2. `npm run preserve`: This command is used to bundle our `openapi.yml` file 
   into an `openapi.json` file that can be used to import the collection/spec.

For additional documentation on how the `swagger-cli` can be used, visit 
[here](https://www.npmjs.com/package/swagger-cli).

## Importing the OpenAPI Specification Into Postman

If you are using Postman, you can import all of the available API endpoints 
into an easy to use collection by following the instructions below:

1. While inside a Postman Workspace, you should see an **`import`** button at 
   the top of your list of collections. Click this to begin the importing process.
2. After clicking **`import`**, a dialog will open providing you with a couple 
   of options for importing the collection. The easiest is to import using a 
   **`Link`**. To do this, simply paste the following URL into the input box, 
   and click **`Import`**: 
   `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`. 
   Alternatively, you can use the **`Raw text`** option by copying the JSON 
   found at 
   `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`, and 
   pasting it into the input box.

You should see something like this in your collections once you have 
successfully imported the spec:

<p align="center">
  <a href="./docs/imported-collection.png">
    <img src="./docs/imported-collection.png" width="25%" height="25%" align="center">
  </a>
</p>

## Reference Implementation

To simplify the creation of test vectors for the spec, we intend to provide 
a reference implementation.

This implementation will cover all required AND optional APIs, and will be 
used to ensure no breaking changes are accidentaly contributed to the spec.

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

## Development

```
git clone git@github.com:w3c-ccg/traceability-interop.git
cd traceability-interop
npm i
npm run serve
```
