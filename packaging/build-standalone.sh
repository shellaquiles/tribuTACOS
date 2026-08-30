#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"
export BUILD_MODE=standalone
npm run build
rm -rf "$ROOT/backend/static"
cp -a "$ROOT/frontend/out" "$ROOT/backend/static"
echo "Standalone listo: backend/static (index.html)"
echo "Arranque: python packaging/launcher.py"
