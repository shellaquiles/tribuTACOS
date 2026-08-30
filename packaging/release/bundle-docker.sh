#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VERSION="${1:-${TRIBUTACOS_VERSION:-latest}}"
VERSION="${VERSION#v}"
STAGE="$(mktemp -d)"
BUNDLE="$ROOT/dist/tributacos-docker-${VERSION}.zip"

mkdir -p "$ROOT/dist" "$STAGE"
if [ "$VERSION" != "latest" ]; then
  printf 'TRIBUTACOS_VERSION=%s\n' "$VERSION" > "$STAGE/.env"
fi
cp "$ROOT/docker-compose.published.yml" "$STAGE/docker-compose.yml"
cp "$ROOT/Iniciar-Tributacos.bat" "$STAGE/" 2>/dev/null || true
cp "$ROOT/Detener-Tributacos.bat" "$STAGE/" 2>/dev/null || true
cp "$ROOT/Centro-de-Control-Tributacos.bat" "$STAGE/" 2>/dev/null || true
cp "$ROOT/docs/INSTALACION_USUARIO.md" "$STAGE/"
if [ -d "$ROOT/scripts/macos" ]; then
  mkdir -p "$STAGE/scripts/macos" "$STAGE/scripts/linux" "$STAGE/scripts/windows"
  cp -a "$ROOT/scripts/macos/." "$STAGE/scripts/macos/"
  cp -a "$ROOT/scripts/linux/." "$STAGE/scripts/linux/"
  cp -a "$ROOT/scripts/windows/." "$STAGE/scripts/windows/"
fi

cat > "$STAGE/LEEME.txt" <<EOF
tribuTACOS ${VERSION}
=====================

1. Instala Docker Desktop y espera a que este en ejecucion.
2. Este ZIP incluye .env con TRIBUTACOS_VERSION=${VERSION} para no usar latest por error.
3. Windows: doble clic en Iniciar-Tributacos.bat
   macOS:   abre scripts/macos/iniciar-docker.command
   Linux:   bash scripts/linux/iniciar-docker.sh
4. Abre http://localhost:3000

Para detener: Detener-Tributacos.bat (o el script equivalente).
EOF

(
  cd "$STAGE"
  zip -r "$BUNDLE" .
)
rm -rf "$STAGE"
echo "Generado: $BUNDLE"
