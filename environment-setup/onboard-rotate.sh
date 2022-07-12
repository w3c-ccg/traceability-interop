#!/usr/bin/env bash
#
# This script is a wrapper to call the onboard-rotate workflow in the
# w3c-ccg/traceability-interop repository.

set -o errexit
set -o nounset
set -o pipefail

GITHUB_REPOSITORY='w3c-ccg/traceability-interop'
GITHUB_TOKEN=$(gh auth status -t  2>&1 | grep Token | awk '{print $3}')

if [ -z "$GITHUB_TOKEN" ]; then
  echo "You must first authenticate with 'gh auth login'"
  exit 1
fi

gh workflow run onboard-rotate.yml --repo "$GITHUB_REPOSITORY" \
  -f token="$GITHUB_TOKEN"
