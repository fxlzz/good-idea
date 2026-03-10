#!/usr/bin/env sh
set -e

echo "entrypoint: starting container" >&2

cd /app/server
echo "entrypoint: running npx chroma" >&2
npx chroma run --host 0.0.0.0 --port 8000 --path /data/chroma &

cd /app
echo "entrypoint: starting node server" >&2
node server/src/index.js