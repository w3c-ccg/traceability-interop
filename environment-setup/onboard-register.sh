#!/usr/bin/env bash
#
# This script is a wrapper to call the onboard-register workflow in the
# w3c-ccg/traceability-interop repository. Options correspond to inputs for the
# workflow
#
# Examples:
#
#   # Register contents of secrets.b64 under prefix VENDOR_PREFIX_. This will
#   # fail if the secrets being registered already exist.
#
#   onboard-register.sh -p VENDOR_PREFIX_ secrets.b64
#
#   # Register contents of secrets.b64 under prefix VENDOR_PREFIX_ and
#   # overwrite any existing values for those secrets.
#
#   onboard-register.sh -p VENDOR_PREFIX_ -o secrets.b64

set -o errexit
set -o nounset
set -o pipefail

usage() { echo "Usage: $0 -p <string> [-o] dotenv" 1>&2; exit 1; }

OVERWRITE="false"
while getopts "p:o" o; do
  case "${o}" in
    p)
      PREFIX=${OPTARG}
      ;;
    o)
      OVERWRITE="true"
      ;;
    *)
      usage
      ;;
  esac
done
shift $((OPTIND-1))

if [ -z "$1" ] || [ ! -f "$1" ]; then
  echo "You must specify a valid dotenv file"
  exit 1
fi;

GITHUB_REPOSITORY='w3c-ccg/traceability-interop'
GITHUB_TOKEN=$(gh auth status -t  2>&1 | grep Token | awk '{print $3}')
DOTENV=`cat $1`

if [ -z "$GITHUB_TOKEN" ]; then
  echo "You must first authenticate with 'gh auth login'"
  exit 1
fi

gh workflow run onboard-register.yml --repo "$GITHUB_REPOSITORY" \
  -f token="$GITHUB_TOKEN" \
  -f prefix="$PREFIX" \
  -f dotenv="$DOTENV" \
  -f overwrite="$OVERWRITE"
