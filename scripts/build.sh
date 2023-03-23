#!/bin/sh
#
# This script is meant to be ran from within package.json, so that all node-installed binaries are available
#
set -e

rm -rf build

mkdir build

# Move over relevant files
cp package.json build/
cp -R src build/src

# Generate JS files and source maps
tsc --project tsconfig.build.json

# Generate/copy all other files
echo '@applandstream/streaming-view-sdk' > build/README.md
