#!/usr/bin/env sh
set -e
echo "entrypoint: starting server" >&2
cd /app && node server/src/index.js