#!/usr/bin/env python3
"""
CLI de Sembrado y Mantenimiento del Catálogo SAT
Permite inicializar, verificar o forzar la recarga de las 52,551 claves del SAT.

Uso:
    python backend/seed_catalogo.py
    python backend/seed_catalogo.py --force
"""

import sys
import os

# Asegurar path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal, init_db
from app.models import CatalogoSatClave
from app.catalogos.seed import sembrar_catalogo_sat

def main():
    print("=" * 60)
    print("🌮 tributacos - Catálogo Oficial SAT (52,551 Registros)")
    print("=" * 60)
    
    init_db()
    db = SessionLocal()
    
    force = "--force" in sys.argv or "-f" in sys.argv
    conteo_inicial = db.query(CatalogoSatClave).count()
    print(f"📊 Registros actuales en base de datos: {conteo_inicial:,}")
    
    total = sembrar_catalogo_sat(db, force=force)
    print(f"✨ Catálogo listo para operación: {total:,} claves activas.")
    db.close()

if __name__ == "__main__":
    main()
