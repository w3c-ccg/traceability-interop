# Traceability Interoperability

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
2. Make sure to kick everyone out of the room when the meeting is done.
3. Once the last person leaves, everything else is automated (publishing raw IRC
   log, audio, and video). If you want to clean up the minutes, it takes about
   5-10 minutes to clean up the transcription and publish it.

 
## [Open API Specification](https://w3c-ccg.github.io/traceability-interop/)

The spec contains documentation on use cases as well are required and optional API operations. You can validate that the openapi spec by running `npm run validate-spec`.

## Importing the Open API Specification Into Postman

If you are using Postman, you can import all of the available API end-points into an easy to use collection by following the instructions below:

1. While inside a Workspace with Postman, you should see an `import` button at the top of your list of collections. Click this to begin the importing process.
2. After clicking `import`, a dialog will open providing you with a couple different options for importing the collection. The easiest option is to import using a `Link`. To do this, simply add this URL into the input and click `Import`: `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json`. If you do not want to use this method, you can also use the `Raw text` option by simply copying the json at `https://w3c-ccg.github.io/traceability-interop/openapi/openapi.json` and pasting it inside the input.

You should see something like this in your collections once you have succesffuly imported the spec:

![Postman collection](./docs/imported-collection.png)
## Reference Implementation

In order to simplify the creation of test vectors for the spec, we intend to provide a reference implementation.

This implementation will cover all required AND optional APIs and will be used to ensure no breaking changes are accidentaly contributed to the spec.

## Postman Interoperability Test Suite

In order to ensure interoperability tests are conducted in a manner consistent with production environments, we will be maintaining postman collections and client credential configuration in github actons.

This will allow us to test implementations in production with the appropriate security and authorizaton policies in place.


## Development

```
git clone git@github.com:w3c-ccg/traceability-interop.git
cd traceability-interop
npm i
npm run serve
```