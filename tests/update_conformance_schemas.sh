#!/usr/bin/env bash
#
# update_schemas.sh
#
#

set -euo pipefail

# Dereferenced JSON schema allows extraction of specific parts using jq
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )";
YAML_SRC=`dirname "$SCRIPT_DIR"`/docs/openapi/openapi.yml
JSON_SCHEMA=$(npx swagger-cli bundle "$YAML_SRC" --dereference)

# update_postman injects schema into postman collection
# $1 - Postman schema file
# $2 - Postman collection variable name for schema
# $3 - Stringified JSON schema to inject into Postman collection
function update_postman() {
  FILE=$1; KEY=$2; SCHEMA=$3
  # Using a temp file (vs. in-place update) prevents truncation on failure
  TMP=$(mktemp)
  jq --arg k "$KEY" --arg s "$SCHEMA" --tab \
    '(.variable[] | select(.key==($k))).value=($s)' \
    "$FILE" > "$TMP" && mv "$TMP" "$FILE"
}

# get_schema extracts stringified JSON schema from openapi schema file
# $1 - JQ selector string for the schema to extract
function get_schema() {
  SCHEMA=$(echo $JSON_SCHEMA | jq -c $1)
  # Examples should be excluded from schema
  SCHEMA=$(echo $SCHEMA | jq -c 'del(..|.example?)')
  # JSON schema does not support "format" keyword for "integer" type
  SCHEMA=$(echo $SCHEMA | sed -e 's/,"format":"int32"//')
  echo $SCHEMA
}

# API Configuration [200]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema200ApiConfiguration" \
  "$(get_schema '.paths["/did.json"].get.responses["200"].content["application/json"].schema')"

# Identifiers [200]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema200Identifiers" \
  "$(get_schema '.paths["/identifiers/{did}"].get.responses["200"].content["application/json"].schema')"

# Identifiers [400]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema400Identifiers" \
  "$(get_schema '.paths["/identifiers/{did}"].get.responses["400"].content["application/json"].schema')"

# Identifiers [404]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema404" \
  "$(get_schema '.paths["/identifiers/{did}"].get.responses["404"].content["application/json"].schema')"

# Credentials - Issue [201]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema201CredentialsIssue" \
  "$(get_schema '.paths["/credentials/issue"].post.responses["201"].content["application/json"].schema')"

# Credentials - Issue [400]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema400" \
  "$(get_schema '.paths["/credentials/issue"].post.responses["400"].content["application/json"].schema')"

# Credentials - Issue [401]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema401" \
  "$(get_schema '.paths["/credentials/issue"].post.responses["401"].content["application/json"].schema')"

# Credentials - Issue [403]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema403" \
  "$(get_schema '.paths["/credentials/issue"].post.responses["403"].content["application/json"].schema')"

# Credentials - Issue [422]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema422CredentialsIssue" \
  "$(get_schema '.paths["/credentials/issue"].post.responses["422"].content["application/json"].schema')"

# Credentials - Issue [500]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema500" \
  "$(get_schema '.paths["/credentials/issue"].post.responses["500"].content["application/json"].schema')"

# Credentials - Verify [200]
update_postman \
"conformance_suite.postman_collection.json" \
  "responseSchema200CredentialsVerify" \
  "$(get_schema '.paths["/credentials/verify"].post.responses["200"].content["application/json"].schema')"
