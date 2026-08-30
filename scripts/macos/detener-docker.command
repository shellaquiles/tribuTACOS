#!/bin/bash
cd "$(dirname "$0")/../.." || exit 1
if [ -f docker/Dockerfile.backend ]; then
  docker compose down
elif [ -f docker-compose.published.yml ]; then
  docker compose -f docker-compose.published.yml down
else
  docker compose down
fi
echo "tribuTACOS detenido."
