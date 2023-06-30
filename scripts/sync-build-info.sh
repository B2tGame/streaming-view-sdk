#!/bin/sh
set -e

VERSION=$(node -pe "require('./package.json').version")
echo "Syncing build info for version $VERSION"

echo "{ \"tag\": \"$VERSION\" }" > src/controllers/build-info.json

git add src/controllers/build-info.json
