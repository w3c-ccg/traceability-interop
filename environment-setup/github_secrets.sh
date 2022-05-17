echo "Updating GitHub Secrets with CLI..."

source $1;


# Reading variables from .env
set -a 
. ./.env 
set +a

case $1 in

  MAVENNET)
    echo "Setting Mavennet Secrets."
    ORG='MAVENNET_STAGING_TEST'
    ;;
  TRANSMUTE)
    echo "Setting Transmute Secrets."
    ORG='TRANSMUTE_PRODUCTION'
    ;;
  MESUR)
    echo "Setting Mesur Secrets."
    ORG='MESUR_IO_PRODUCTION'
    ;;
  *)
    echo "No org selected to set."
    exit 1
    ;;
esac



gh secret set $ORG'_TEST_VARIABLE' --body $TOKEN_AUDIENCE
gh secret set $ORG'_TOKEN_ENDPOINT' --body "$TOKEN_ENDPOINT"
gh secret set $ORG'_STAGING_API_BASE_URL' --body "$API_BASE_URL"
gh secret set $ORG'_ORGANIZATION_DID_WEB' --body "$ORGANIZATION_DID_WEB"
gh secret set $ORG'_CLIENT_ID' --body "$CLIENT_ID"
gh secret set $ORG'_CLIENT_SECRET' --body "$CLIENT_SECRET"