#!/bin/bash
# Compatibilidad: usa el runner oficial. Preferible: make dev
cd "$(dirname "$0")" || exit 1
exec python3 scripts/tributacos.py dev
