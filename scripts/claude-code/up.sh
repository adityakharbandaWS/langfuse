#!/usr/bin/env bash
# Starts local Langfuse with the Claude Code usage/cost patch.
# Builds the worker from this checkout (the first build takes ~10 minutes) and
# runs the stock web image of the same release. Extra arguments go to
# `docker compose up`.
set -euo pipefail

cd "$(dirname "$0")/../.."

LANGFUSE_VERSION="$(sed -n 's/^  "version": "\([0-9.]*\)",$/\1/p' package.json | head -n 1)"
if [ -z "$LANGFUSE_VERSION" ]; then
  echo "Could not read the Langfuse version from package.json" >&2
  exit 1
fi
export LANGFUSE_VERSION

echo "Starting Langfuse ${LANGFUSE_VERSION} with the Claude Code worker patch..."
docker compose -p langfuse -f docker-compose.yml -f docker-compose.claude-code.yml \
  up -d --build "$@"
echo "Langfuse is starting at http://localhost:3000"
