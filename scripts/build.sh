#!/bin/sh
#
# This script is meant to be ran from within package.json, so that all node-installed binaries are available
#
set -e

rm -rf build/*

# Generate JS files and source maps
tsc --build

# Generate/copy all other files
echo '@applandstream/streaming-view-sdk' > build/README.md
cp package.json build/
cp src/controllers/service/neural-network-models/b540f780-9367-427c-8b05-232cebb9ec49.json build/controllers/service/neural-network-models/
