"""
Módulo Autónomo de Sembrado e Inicialización del Catálogo SAT
Permite inicializar e importar las 52,551 claves oficiales del SAT y sus rubros
contables desde cero en cualquier base de datos nueva o existente.

Uso por CLI:
    python -m app.catalogos.seed
"""

import json
import os
import sys
import time
from typing import Optional
from sqlalchemy.orm import Session

# Asegurar path para ejecución directa como script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.dirname(APP_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.models import CatalogoSatClave
from app.catalogos.taxonomia import (
    TAXONOMIA_SEGMENTOS,
    TAXONOMIA_FAMILIAS,
    TAXONOMIA_CLAVES_ESPECIFICAS
)

JSON_PATH = os.path.join(CURRENT_DIR, "c_ClaveProdServ.json")


def sembrar_catalogo_sat(db: Session, force: bool = False) -> int:
    """
    Lee el archivo JSON oficial del SAT, fusiona con la taxonomía contable y
    realiza un bulk insert en la base de datos tributacos.
    """
    total_actual = db.query(CatalogoSatClave).count()
    if total_actual > 0 and not force:
        print(f"ℹ️ El catálogo SAT ya contiene {total_actual:,} registros en DB. Omitiendo seed.")
        return total_actual

    if force and total_actual > 0:
        print(f"🗑️ Forzando resiembra: eliminando {total_actual:,} registros existentes...")
        db.query(CatalogoSatClave).delete()
        db.commit()

    if not os.path.exists(JSON_PATH):
        print(f"⚠️ Archivo no encontrado: {JSON_PATH}")
        return 0

    print("🚀 Iniciando sembrado del Catálogo Oficial SAT...")
    t0 = time.time()

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    db_objects = []
    claves_agregadas = set()

    # 1. Sembrar Segmentos
    for seg, info in TAXONOMIA_SEGMENTOS.items():
        if seg not in claves_agregadas:
            claves_agregadas.add(seg)
            db_objects.append(CatalogoSatClave(
                clave=seg,
                nivel="segmento",
                categoria_id=info["id"],
                nombre=info["nombre"],
                icono=info["icono"],
                color=info["color"],
                tipo_gasto=info.get("tipo", "operativo"),
                descripcion_sat=f"Segmento UNSPSC {seg}",
                palabras_similares=info["nombre"]
            ))

    # 2. Sembrar Familias
    for fam, info in TAXONOMIA_FAMILIAS.items():
        if fam not in claves_agregadas:
            claves_agregadas.add(fam)
            db_objects.append(CatalogoSatClave(
                clave=fam,
                nivel="familia",
                categoria_id=info["id"],
                nombre=info["nombre"],
                icono=info["icono"],
                color=info["color"],
                tipo_gasto=info.get("tipo", "operativo"),
                descripcion_sat=f"Familia UNSPSC {fam}",
                palabras_similares=info["nombre"]
            ))

    # 3. Sembrar las 52,514 claves oficiales del SAT
    for it in items:
        c = str(it.get("id") or it.get("c_ClaveProdServ", "")).strip()
        if not c or c in claves_agregadas:
            continue
        claves_agregadas.add(c)
        desc = it.get("descripcion") or it.get("Descripcion", "")
        palabras = it.get("palabrasSimilares") or it.get("palabras_similares", "")

        # Determinar categoría asignada
        if c in TAXONOMIA_CLAVES_ESPECIFICAS:
            info = TAXONOMIA_CLAVES_ESPECIFICAS[c]
            cat_id = info["id"]
            nombre = info["nombre"]
            icono = info["icono"]
            color = info["color"]
            tipo = info.get("tipo", "operativo")
        else:
            fam = c[:4]
            seg = c[:2]
            if fam in TAXONOMIA_FAMILIAS:
                info = TAXONOMIA_FAMILIAS[fam]
                cat_id = info["id"]
                nombre = info["nombre"]
                icono = info["icono"]
                color = info["color"]
                tipo = info.get("tipo", "operativo")
            elif seg in TAXONOMIA_SEGMENTOS:
                info = TAXONOMIA_SEGMENTOS[seg]
                cat_id = info["id"]
                nombre = info["nombre"]
                icono = info["icono"]
                color = info["color"]
                tipo = info.get("tipo", "operativo")
            else:
                cat_id = "otros_operativos"
                nombre = desc or "Otros Gastos Operativos"
                icono = "📋"
                color = "#64748b"
                tipo = "operativo"

        db_objects.append(CatalogoSatClave(
            clave=c,
            nivel="producto",
            categoria_id=cat_id,
            nombre=nombre,
            icono=icono,
            color=color,
            tipo_gasto=tipo,
            descripcion_sat=desc,
            palabras_similares=palabras
        ))

    # Inserción masiva optimizada por lotes de 5,000
    batch_size = 5000
    for i in range(0, len(db_objects), batch_size):
        db.bulk_save_objects(db_objects[i:i + batch_size])
        db.commit()

    duracion = round(time.time() - t0, 2)
    total_insertados = len(db_objects)
    print(f"✅ Sembrado completado con éxito: {total_insertados:,} registros en {duracion}s.")
    return total_insertados


def asegurar_catalogo_sat(db: Session) -> bool:
    """
    Hook ligero para llamar al inicio de la aplicación. Si la tabla está vacía,
    ejecuta el sembrado automáticamente.
    """
    try:
        count = db.query(CatalogoSatClave).count()
        if count == 0:
            print("📦 Base de datos limpia detectada. Ejecutando auto-seed del catálogo SAT...")
            sembrar_catalogo_sat(db)
            return True
        return False
    except Exception as e:
        print(f"⚠️ Error verificando catálogo SAT en DB: {e}")
        return False


if __name__ == "__main__":
    from app.database import SessionLocal, init_db
    init_db()
    db_session = SessionLocal()
    force_seed = "--force" in sys.argv
    sembrar_catalogo_sat(db_session, force=force_seed)
    db_session.close()
