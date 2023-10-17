organization_did_web=did:web:nf-refiner.loca.lt
client_id=1skggb4216e0ohgjjq4aast9i1
client_secret=cb5g9icc3ta3nu3c401u1epg02nu738sf987seul4ccp99v436t
token_audience=https://api.staging.refiner.neoflow.energy/v1
token_endpoint=nf-refiner.loca.lt/auth
api_base_url=https://nf-refiner.loca.lt

# echo $organization_did_web $client_id $client_secret $token_audience $token_endpoint $api_base_url

npx newman run ./docs/tutorials/credentials-issue/credentials-issue.postman_collection.json \
--env-var ORGANIZATION_DID_WEB=$organization_did_web \
--env-var CLIENT_ID=$client_id \
--env-var CLIENT_SECRET=$client_secret \
--env-var TOKEN_AUDIENCE=$token_audience \
--env-var TOKEN_ENDPOINT=$token_endpoint \
--env-var API_BASE_URL=$api_base_url \
--reporters cli,htmlextra,json \
--reporter-htmlextra-skipSensitiveData 
# --reporter-htmlextra-export "newman/${{format('{0}-{1}-{2}.html', github.run_id, github.job, matrix.name)}}" \
# --reporter-json-export "newman/${{format('{0}-{1}-{2}.json', github.run_id, github.job, matrix.name)}}"