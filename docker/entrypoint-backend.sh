#!/bin/sh
set -e

mkdir -p /data/cfdi_emitidos /data/cfdi_recibidos /data/descargados

if [ ! -f /data/tributacos.db ]; then
  echo "Primera ejecucion: preparando base de datos demo..."
  python -m app.cli init-db
  python -m app.cli seed-sat
  python -m app.cli seed-demo --fixture
  echo "Base de datos lista."
fi

exec "$@"
