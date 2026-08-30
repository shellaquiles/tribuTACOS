#!/bin/bash
cd "$(dirname "$0")/../.." || exit 1
echo "Iniciando tribuTACOS..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Instala Docker Desktop: https://www.docker.com/products/docker-desktop/"
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
python3 -m webbrowser "http://localhost:3000" 2>/dev/null || open "http://localhost:3000" 2>/dev/null || true
echo "Listo en http://localhost:3000"
