In this tutorial we will test:

1. verifying did-web resolution

The postman collection can be run from the colland-line using `newman` and a local `.env` file containing your organizations secrets.

_Example: Run postman collection from the command-line_
```sh
source .env && \
npx newman run ./did-web-discovery.postman_collection.json \
--env-var ORGANIZATION_DID_WEB=$ORGANIZATION_DID_WEB \
--env-var CLIENT_ID=$CLIENT_ID \
--env-var CLIENT_SECRET=$CLIENT_SECRET \
--env-var TOKEN_AUDIENCE=$TOKEN_AUDIENCE \
--env-var TOKEN_ENDPOINT=$TOKEN_ENDPOINT \
--env-var API_BASE_URL=$API_BASE_URL \
--reporters cli,json \
--reporter-json-export ./did-web-discovery-tutorial.collection.report.json
```
