#!/bin/sh
set -e

cp package.json build/package.json

cp .npmrc build/.npmrc 2>/dev/null || true

cp src/controllers/build-info.json build/src/controllers/build-info.json
