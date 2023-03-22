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
cp -R src build/src
