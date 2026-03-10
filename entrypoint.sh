#!/usr/bin/env sh
set -e

cd /app/server
npx chroma run --host 0.0.0.0 --port 8000 --path /data/chroma &

cd /app
node server/src/index.js

