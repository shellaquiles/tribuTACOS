"""
Motor de Resolución y Enriquecimiento de Conceptos SAT
Utiliza la taxonomía estructurada y búsqueda en memoria O(1) (< 1µs)
para clasificar artículos, productos y servicios fiscales.
"""

import json
import os
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.catalogos.taxonomia import (
    TAXONOMIA_SEGMENTOS,
    TAXONOMIA_FAMILIAS,
    TAXONOMIA_CLAVES_ESPECIFICAS
)
from app.catalogos.seed import sembrar_catalogo_sat, asegurar_catalogo_sat

CATALOGO_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(CATALOGO_DIR, "c_ClaveProdServ.json")

# ─── DICCIONARIOS DE MEMORIA (O(1) Ultra-Rápido) ───
_CATALOGO_DICT: Dict[str, Dict[str, Any]] = {}


def _cargar_catalogo_json():
    global _CATALOGO_DICT
    if _CATALOGO_DICT:
        return
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                items = json.load(f)
            for item in items:
                clave = str(item.get("c_ClaveProdServ", item.get("id", ""))).strip()
                if clave:
                    _CATALOGO_DICT[clave] = {
                        "clave": clave,
                        "descripcion": (item.get("Descripcion") or item.get("descripcion") or "").strip(),
                        "palabras_similares": (item.get("palabras_similares") or item.get("palabrasSimilares") or "").strip(),
                        "segmento": clave[:2] if len(clave) >= 2 else "",
                        "familia": clave[:4] if len(clave) >= 4 else "",
                        "clase": clave[:6] if len(clave) >= 6 else ""
                    }
        except Exception as e:
            print(f"[SAT Catalogo] Error cargando JSON en memoria: {e}")


# Carga inicial en memoria
_cargar_catalogo_json()


def get_clave_sat_info(clave: str) -> Optional[Dict[str, Any]]:
    """Consulta la descripción oficial y metadatos de una clave de 8 dígitos del SAT en memoria O(1)."""
    if not clave:
        return None
    return _CATALOGO_DICT.get(str(clave).strip())


def poblar_catalogo_db(db: Session, force: bool = False) -> int:
    """Wrapper hacia el sembrador de base de datos."""
    return sembrar_catalogo_sat(db, force=force)


def resolver_partida_sat(clave: str, descripcion_concepto: str = "") -> Dict[str, Any]:
    """
    Resuelve la categoría contable, icono, color y tipo de gasto para un concepto
    siguiendo la jerarquía oficial:
    1. Clave específica de 8 dígitos (máxima prioridad)
    2. Familia UNSPSC (4 dígitos)
    3. Segmento UNSPSC (2 dígitos)
    4. Análisis semántico por descripción de la partida
    5. Fallback a 'otros_operativos'
    """
    c = str(clave or "").strip()
    desc_upper = (descripcion_concepto or "").upper()

    # 1. Clave exacta de 8 dígitos en taxonomía prioritaria
    if c in TAXONOMIA_CLAVES_ESPECIFICAS:
        info = TAXONOMIA_CLAVES_ESPECIFICAS[c]
        sat_data = _CATALOGO_DICT.get(c, {})
        return {
            "id": info["id"],
            "nombre": info["nombre"],
            "icono": info["icono"],
            "color": info["color"],
            "tipo": info.get("tipo", "operativo"),
            "descripcion_sat": sat_data.get("descripcion", info["nombre"])
        }

    # 2. Familia UNSPSC (4 dígitos)
    fam = c[:4] if len(c) >= 4 else ""
    if fam in TAXONOMIA_FAMILIAS:
        info = TAXONOMIA_FAMILIAS[fam]
        sat_data = _CATALOGO_DICT.get(c, {})
        return {
            "id": info["id"],
            "nombre": info["nombre"],
            "icono": info["icono"],
            "color": info["color"],
            "tipo": info.get("tipo", "operativo"),
            "descripcion_sat": sat_data.get("descripcion", info["nombre"])
        }

    # 3. Segmento UNSPSC (2 dígitos)
    seg = c[:2] if len(c) >= 2 else ""
    if seg in TAXONOMIA_SEGMENTOS:
        info = TAXONOMIA_SEGMENTOS[seg]
        sat_data = _CATALOGO_DICT.get(c, {})
        return {
            "id": info["id"],
            "nombre": info["nombre"],
            "icono": info["icono"],
            "color": info["color"],
            "tipo": info.get("tipo", "operativo"),
            "descripcion_sat": sat_data.get("descripcion", info["nombre"])
        }

    # 4. Búsqueda directa en catálogo completo del SAT
    if c in _CATALOGO_DICT:
        sat_data = _CATALOGO_DICT[c]
        desc_sat = sat_data.get("descripcion", "")
        return {
            "id": f"sat_{fam}" if fam else "otros_operativos",
            "nombre": desc_sat if len(desc_sat) <= 35 else f"{desc_sat[:32]}...",
            "icono": "📋",
            "color": "#64748b",
            "tipo": "operativo",
            "descripcion_sat": desc_sat
        }

    # 5. Análisis semántico por palabras clave
    if any(k in desc_upper for k in ["GASOLINA", "COMBUSTIBLE", "DIESEL", "MAGNA", "PREMIUM"]):
        return {"id": "combustibles", "nombre": "Combustibles y Gasolinas", "icono": "⛽", "color": "#f97316", "tipo": "operativo"}
    if any(k in desc_upper for k in ["CASETA", "PEAJE", "AUTOPISTA", "TAG", "TELEVIA"]):
        return {"id": "casetas_peajes", "nombre": "Casetas, Peajes y Autopistas", "icono": "🛣️", "color": "#64748b", "tipo": "viaticos"}
    if any(k in desc_upper for k in ["RENTA AUTO", "LEASING", "ARRENDAMIENTO VEHICUL", "PULSE AUDACE", "TIP AUTO"]):
        return {"id": "arrendamiento_vehiculos", "nombre": "Arrendamiento de Vehículos (Leasing)", "icono": "🚗", "color": "#3b82f6", "tipo": "operativo"}
    if any(k in desc_upper for k in ["UBER", "DIDI", "CABIFY", "TAXI", "TARIFA"]):
        return {"id": "taxis_plataformas", "nombre": "Plataformas de Movilidad y Taxis", "icono": "🚕", "color": "#f59e0b", "tipo": "viaticos"}
    if any(k in desc_upper for k in ["SEGURO", "POLIZA", "COBERTURA", "FIANZA", "QUALITAS", "GNP", "AXA"]):
        return {"id": "seguros_polizas", "nombre": "Seguros y Fianzas", "icono": "🛡️", "color": "#0d9488", "tipo": "operativo"}
    if any(k in desc_upper for k in ["HONORARIOS", "ASESORIA", "CONSULTORIA", "CONTABILIDAD", "LEGAL", "AUDITORIA"]):
        return {"id": "servicios_profesionales", "nombre": "Servicios Profesionales y Asesoría", "icono": "💼", "color": "#059669", "tipo": "operativo"}
    if any(k in desc_upper for k in ["HOSTING", "DOMINIO", "AWS", "AZURE", "GOOGLE CLOUD", "SOFTWARE", "SAAS", "LICENCIA"]):
        return {"id": "software_nube", "nombre": "Software, Nube y Telecomunicaciones", "icono": "🌐", "color": "#8b5cf6", "tipo": "operativo"}
    if any(k in desc_upper for k in ["TRANSISTOR", "CONECTOR", "CAPACITOR", "RESISTENCIA", "DIODO", "CIRCUITO"]):
        return {"id": "electronica", "nombre": "Componentes Electrónicos", "icono": "🔌", "color": "#0284c7", "tipo": "operativo"}

    return {
        "id": "otros_operativos",
        "nombre": "Otros Gastos Operativos",
        "icono": "📋",
        "color": "#64748b",
        "tipo": "operativo",
        "descripcion_sat": "Gasto operativo sin clave específica"
    }


def get_taxonomia_completa() -> Dict[str, Any]:
    """Retorna la taxonomía contable completa organizada para consumo de clientes API."""
    return {
        "segmentos": TAXONOMIA_SEGMENTOS,
        "familias": TAXONOMIA_FAMILIAS,
        "claves_especificas": TAXONOMIA_CLAVES_ESPECIFICAS,
        "total_claves_sat_oficiales": len(_CATALOGO_DICT)
    }
