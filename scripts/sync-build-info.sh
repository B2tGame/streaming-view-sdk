#!/bin/sh
set -e

VERSION=$(cat package.json | jq -r '.version')

echo "{ \"tag\": \"$VERSION\" }" > src/controllers/build-info.json

git add src/controllers/build-info.json
