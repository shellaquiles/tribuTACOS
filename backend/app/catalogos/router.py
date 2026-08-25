from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.database import get_db
from app.models import CatalogoSatClave
from app.catalogos.sat_catalogo import (
    get_taxonomia_completa,
    resolver_partida_sat,
    poblar_catalogo_db,
    get_clave_sat_info
)

router = APIRouter(prefix="/api/catalogos", tags=["Catálogos SAT"])


@router.get("/sat-gastos")
def get_sat_gastos_catalog(db: Session = Depends(get_db)):
    """Retorna la taxonomía contable y jerárquica del SAT para el frontend."""
    taxonomia = get_taxonomia_completa()
    total_db = db.query(CatalogoSatClave).count()
    return {
        "status": "success",
        "total_registros_db": total_db,
        "taxonomia": taxonomia
    }


@router.get("/sat-clave/{clave}")
def get_clave_detail(clave: str, db: Session = Depends(get_db)):
    """Consulta una clave SAT específica (8, 4 o 2 dígitos)."""
    item = db.query(CatalogoSatClave).filter(CatalogoSatClave.clave == clave.strip()).first()
    if item:
        return item.to_dict()
    
    # Fallback en memoria si la DB aún se está poblando
    res = resolver_partida_sat(clave)
    sat_info = get_clave_sat_info(clave)
    if sat_info:
        res["descripcion_sat"] = sat_info.get("descripcion")
    return res


@router.post("/sincronizar-db")
def sync_catalogo_db(db: Session = Depends(get_db)):
    """Puebla o sincroniza la base de datos con el catálogo completo del SAT."""
    conteo = poblar_catalogo_db(db)
    return {
        "status": "success",
        "mensaje": f"Catálogo SAT sincronizado con éxito ({conteo} registros en base de datos).",
        "total_registros": conteo
    }
