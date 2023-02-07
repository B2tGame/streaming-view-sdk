#!/bin/sh
set -e

# This is run to ensure that build-info.json in build/ is up to date and that build/ is there
npm run build

cp package.json build/package.json

# TODO: remove this once we know that the build works
# npmrc is added by build.yml to contain the npm-token to be able to push to npm
# However, on local it is not available
#cp .npmrc build/.npmrc 2>/dev/null || true

