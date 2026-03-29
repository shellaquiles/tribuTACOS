"""
cat_sat.py – Catálogo de SAT c_ClaveProdServ
Fuente: SAT-CFDI/python-satcfdi (https://github.com/SAT-CFDI/python-satcfdi)
SQLite oficial mantenido por la comunidad CFDI.
Fallback: c_ClaveProdServ.json de bambucode si satcfdi no está disponible.
"""
import os
import pickle

_CATALOG: dict = {}


def _load_from_satcfdi() -> bool:
    """Carga el catálogo desde el SQLite de satcfdi instalado en el venv."""
    try:
        from satcfdi.catalogs import conn
        cur = conn.cursor()
        # C756_c_ClaveProdServ es el catálogo CFDI 4.0 (y CFDI 3.3 compatible)
        rows = cur.execute('SELECT key, value FROM "C756_c_ClaveProdServ"').fetchall()
        if rows:
            global _CATALOG
            _CATALOG = {str(pickle.loads(k)): str(pickle.loads(v)) for k, v in rows}
            return True
    except Exception:
        pass
    return False


def _load_from_json() -> bool:
    """Fallback: carga el catálogo desde el JSON local de bambucode."""
    catalog_path = os.path.join(os.path.dirname(__file__), 'c_ClaveProdServ.json')
    if not os.path.exists(catalog_path):
        return False
    try:
        import json
        with open(catalog_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        global _CATALOG
        _CATALOG = {item['id']: item['descripcion']
                    for item in data if 'id' in item and 'descripcion' in item}
        return bool(_CATALOG)
    except Exception:
        return False


def _load():
    if not _load_from_satcfdi():
        _load_from_json()


_load()


def describe(clave: str, fallback: str = '') -> str:
    """Devuelve la descripción oficial SAT para la ClaveProdServ dada."""
    return _CATALOG.get(str(clave), fallback)


def is_loaded() -> bool:
    return bool(_CATALOG)
