#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
if ! command -v docker >/dev/null 2>&1; then
  echo "Instala Docker: https://docs.docker.com/engine/install/"
  exit 1
fi
if [ -f docker/Dockerfile.backend ]; then
  docker compose up --build -d
elif [ -f docker-compose.published.yml ]; then
  docker compose -f docker-compose.published.yml up -d
else
  docker compose up -d
fi
sleep 8
xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
echo "tribuTACOS listo en http://localhost:3000"
