# Traceability Interoperability

[![Interoperability Report](https://github.com/w3c-ccg/traceability-interop/actions/workflows/interoperability-report.yml/badge.svg)](https://github.com/w3c-ccg/traceability-interop/actions/workflows/interoperability-report.yml)
[![Conformance Report](https://github.com/w3c-ccg/traceability-interop/actions/workflows/conformance-run.yml/badge.svg)](https://github.com/w3c-ccg/traceability-interop/actions/workflows/conformance-run.yml)

## Latest Spec

- [https://w3id.org/traceability/interoperability/openapi](https://w3id.org/traceability/interoperability/openapi)

## Traceability Interoperability

- [Conformance Test Suite](https://w3id.org/traceability/interoperability/reports/conformance)
- [Interoperability Test Suite](https://w3id.org/traceability/interoperability/reports/interoperability)
- [Getting Started](https://github.com/w3c-ccg/traceability-interop/tree/main/reporting)
- [Conformance Report Archive](https://w3id.org/traceability/interoperability/reports/conformance/index.json)
- [Interoperability Report Archive](https://w3id.org/traceability/interoperability/reports/interoperability/index.json)

## About

An enterprise grade HTTP API for leveraging [W3C Decentralized Identifiers](https://www.w3.org/TR/did-core/) and [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) with [W3C CCG Traceability Vocabulary](https://w3c-ccg.github.io/traceability-vocab/) and the [VC API](https://w3c-ccg.github.io/vc-api/) when possible.

## Meetings

Meetings are held

- Tuesdays at 1.30pm ET/10.30pm PT
- on jitsi using this link: [meet.w3c-ccg.org/traceability](https://meet.w3c-ccg.org/traceability)
- with standing agenda to review open [Pull Requests](https://github.com/w3c-ccg/traceability-interop/pulls),
  then [open Issues](https://github.com/w3c-ccg/traceability-interop/issues), unless otherwise noted on the mailing list

### Hosting instructions

Any chair, editor, or other party authorized by CCG to manage recordings and
minutes can do the following. A scribe-bot will show up in the main #ccg IRC
channel automatically.

1. Make sure to select "Start Recording" at the beginning of the call and "Stop
   Recording" when you're done.

1. Select "Start Recording" to start audio recording

1. Post the agenda link in the meeting chat box

   `Agenda: https://github.com/w3c-ccg/traceability-interop/AGENDA.md`
1. Address IP note, agenda review, and scribe selection topic

    - Note the topic in the chat box

      `Topic: IP Note, Agenda Review, Scribe Selection`
    - Announce the agenda for the meeting. Meetings alternate between focus on the trace-interop and trace-vocab repositories.
    - Read the standard IP note

      > Anyone can participate in these calls. However, all substantive contributors to any CCG Work Items must be members of the CCG with full IPR agreements signed. Information about and links to the required license agreements can be found in the meeting agenda.

1. Move on to GitHub Issue & PR review

    - Note the next topic in the chat box

      `Topic: GitHub Issue & PR review`

    - Review pull requests in order (oldest first)

      For this portion of the meeting, address PRs in the focus repository first, followed by PRs in the other repository.

        - Publish link to sorted PRs in chat box ([trace-interop](https://github.com/w3c-ccg/traceability-interop/pulls?q=is%3Apr+is%3Aopen+sort%3Acreated-asc), [trace-vocab](https://github.com/w3c-ccg/traceability-vocab/pulls?q=is%3Apr+is%3Aopen+sort%3Acreated-asc))

        - Publish link to each PR being discussed in chat box

    - Review issues in order (least recently updated first)

      For this portion of the meeting, address issues in the focus repository first, followed by issues in the other repository.

        - Publish link to sorted issues in chat box ([trace-interop](https://github.com/w3c-ccg/traceability-interop/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc), [trace-vocab](https://github.com/w3c-ccg/traceability-vocab/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-asc))

        - Publish link to each issue being discussed in chat box

1. Make sure to kick everyone out of the room when the meeting is done.

1. [Retrieve and publish meeting minutes](docs/weekly-minutes/)

## [Open API Specification](https://w3c-ccg.github.io/traceability-interop/)

The spec contains documentation on use cases as well as required and optional API operations.

### Included scripts for managing OpenAPI Specification

1. `npm run validate-spec`: This command can be used to validate the `openapi.yml` spec, ensuring there are no issues.
2. `npm run preserve`: This command is used to bundle our `openapi.yml` file into an `openapi.json` file that can be used to import the collection/spec.

For additional documentation on how the `swagger-cli` can be used, visit [here](https://www.npmjs.com/package/swagger-cli).

## Importing the OpenAPI Specification Into Postman

If you are using Postman, you can import all of the available API endpoints into an easy to use collection by following the instructions below:

1. While inside a Postman Workspace, you should see an **import** button at the top of your list of collections. Click this to begin the importing process.
2. After clicking **import**, a dialog will open providing you with a couple of options for importing the collection. The easiest is to import using a **Link**. To do this, simply paste the following URL into the input box, and click **Import**: `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`. Alternatively, you can use the **Raw text** option by copying the JSON found at `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`, and pasting it into the input box.

You should see something like this in your collections once you have succesffuly imported the spec:

![Postman collection](./docs/imported-collection.png)

## Reference Implementation

In order to simplify the creation of test vectors for the spec, we intend to provide a reference implementation.

This implementation will cover all required AND optional APIs and will be used to ensure no breaking changes are accidentaly contributed to the spec.

## Postman Interoperability Test Suite

In order to ensure interoperability tests are conducted in a manner consistent with production environments, we maintain a set of Postman collections and client credential configuration located in the [tutorials](./docs/tutorials/) section of the docs.  These tests are executed via GitHub actions, on demand by implementers, as well as being run on a nightly scheduled basis.

This approach allows us to test implementations in production with the appropriate security and authorization policies in place.

If you would like to register an implementation to be tested against the test suite, please [review the step-by-step instructions provided here](./environment-setup/README.md).

Test suite registration is required for participation in upcoming technical demonstrations with various government and non-government entities related to trade and import/export data exchange.

## Development

```
git clone git@github.com:w3c-ccg/traceability-interop.git
cd traceability-interop
npm i
npm run serve
```
