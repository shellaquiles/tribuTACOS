import json
import os
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

CATALOGO_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(CATALOGO_DIR, "c_ClaveProdServ.json")

# ─── TAXONOMÍA MAESTRA SAT (Segmentos 2-díg, Familias 4-díg, Claves 8-díg) ───

TAXONOMIA_SEGMENTOS: Dict[str, Dict[str, str]] = {
    '15': {'id': 'combustibles', 'nombre': 'Combustibles y Lubricantes', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '25': {'id': 'refacciones_autos', 'nombre': 'Vehículos y Refacciones', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},
    '32': {'id': 'electronica', 'nombre': 'Componentes Electrónicos', 'icono': '🔌', 'color': '#0284c7', 'tipo': 'operativo'},
    '43': {'id': 'computo_ti', 'nombre': 'Tecnología y Cómputo', 'icono': '💻', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '44': {'id': 'oficina_papeleria', 'nombre': 'Papelería e Insumos de Oficina', 'icono': '📎', 'color': '#14b8a6', 'tipo': 'operativo'},
    '50': {'id': 'alimentos', 'nombre': 'Alimentos y Abarrotes', 'icono': '🍎', 'color': '#84cc16', 'tipo': 'operativo'},
    '51': {'id': 'salud_medicamentos', 'nombre': 'Medicamentos y Salud', 'icono': '💊', 'color': '#10b981', 'tipo': 'operativo'},
    '56': {'id': 'mobiliario', 'nombre': 'Mobiliario y Equipamiento', 'icono': '🪑', 'color': '#d97706', 'tipo': 'inversion'},
    '70': {'id': 'servicios_agropecuarios', 'nombre': 'Servicios Agropecuarios y Animales', 'icono': '🌾', 'color': '#15803d', 'tipo': 'operativo'},
    '72': {'id': 'mantenimiento_servicios', 'nombre': 'Instalación y Mantenimiento', 'icono': '🛠️', 'color': '#ca8a04', 'tipo': 'operativo'},
    '78': {'id': 'transporte_fletes', 'nombre': 'Transporte, Fletes y Envíos', 'icono': '🚚', 'color': '#0284c7', 'tipo': 'operativo'},
    '80': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '81': {'id': 'software_nube', 'nombre': 'Software, Nube y Telecomunicaciones', 'icono': '🌐', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '82': {'id': 'publicidad', 'nombre': 'Publicidad y Mercadotecnia', 'icono': '📢', 'color': '#ec4899', 'tipo': 'operativo'},
    '84': {'id': 'servicios_financieros', 'nombre': 'Servicios Financieros, Banca y Seguros', 'icono': '🏦', 'color': '#6366f1', 'tipo': 'financiero'},
    '86': {'id': 'educacion', 'nombre': 'Capacitación y Educación', 'icono': '🎓', 'color': '#3b82f6', 'tipo': 'operativo'},
    '90': {'id': 'viaticos_restaurantes', 'nombre': 'Restaurantes, Hospedaje y Viáticos', 'icono': '☕', 'color': '#d97706', 'tipo': 'viaticos'},
    '95': {'id': 'casetas_peajes', 'nombre': 'Casetas, Peajes y Obras Civiles', 'icono': '🛣️', 'color': '#64748b', 'tipo': 'operativo'},
}

TAXONOMIA_FAMILIAS: Dict[str, Dict[str, str]] = {
    '7012': {'id': 'veterinaria_animales', 'nombre': 'Servicios Veterinarios y Cuidado Animal', 'icono': '🐾', 'color': '#10b981', 'tipo': 'operativo'},
    '8013': {'id': 'arrendamiento_inmuebles', 'nombre': 'Renta de Inmuebles y Oficinas', 'icono': '🏢', 'color': '#15803d', 'tipo': 'operativo'},
    '7810': {'id': 'paqueteria_fletes', 'nombre': 'Paquetería, Mensajería y Fletes', 'icono': '📦', 'color': '#f59e0b', 'tipo': 'operativo'},
    '7811': {'id': 'transporte_pasajeros', 'nombre': 'Transporte y Movilidad', 'icono': '🚗', 'color': '#0284c7', 'tipo': 'operativo'},
    '7812': {'id': 'almacenamiento', 'nombre': 'Almacenamiento y Bodegas', 'icono': '🏭', 'color': '#71717a', 'tipo': 'operativo'},
    '8412': {'id': 'servicios_financieros', 'nombre': 'Servicios Bancarios y Crédito', 'icono': '🏦', 'color': '#6366f1', 'tipo': 'financiero'},
    '8413': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '8411': {'id': 'contabilidad_facturacion', 'nombre': 'Contabilidad y Facturación', 'icono': '🧾', 'color': '#6366f1', 'tipo': 'operativo'},
    '8111': {'id': 'software_ti', 'nombre': 'Software, Nube y Servicios TI', 'icono': '🌐', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '8014': {'id': 'servicios_comerciales', 'nombre': 'Comercialización y Ventas', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '8010': {'id': 'consultoria_gestion', 'nombre': 'Gestión de Empresas y Consultoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '4321': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Laptops', 'icono': '💻', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '4322': {'id': 'redes_telecom', 'nombre': 'Redes y Telecomunicaciones', 'icono': '📡', 'color': '#0284c7', 'tipo': 'operativo'},
    '4323': {'id': 'software_paquete', 'nombre': 'Software y Aplicaciones', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '9010': {'id': 'restaurantes', 'nombre': 'Restaurantes y Alimentos', 'icono': '🍽️', 'color': '#d97706', 'tipo': 'viaticos'},
    '9011': {'id': 'hoteles', 'nombre': 'Hoteles y Hospedaje', 'icono': '🏨', 'color': '#d97706', 'tipo': 'viaticos'},
    '1510': {'id': 'combustibles', 'nombre': 'Combustibles y Gasolinas', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '4412': {'id': 'papeleria', 'nombre': 'Papelería y Artículos de Oficina', 'icono': '📎', 'color': '#14b8a6', 'tipo': 'operativo'},
    '4410': {'id': 'equipos_oficina', 'nombre': 'Impresoras y Equipos de Oficina', 'icono': '🖨️', 'color': '#14b8a6', 'tipo': 'inversion'},
}

TAXONOMIA_CLAVES_ESPECIFICAS: Dict[str, Dict[str, str]] = {
    '78111502': {'id': 'vuelos_aviones', 'nombre': 'Boletos de Avión y Vuelos', 'icono': '✈️', 'color': '#0284c7', 'tipo': 'viaticos'},
    '78111500': {'id': 'vuelos_aviones', 'nombre': 'Boletos de Avión y Vuelos', 'icono': '✈️', 'color': '#0284c7', 'tipo': 'viaticos'},
    '78111811': {'id': 'arrendamiento_vehiculos', 'nombre': 'Arrendamiento de Vehículos (Leasing)', 'icono': '🚗', 'color': '#3b82f6', 'tipo': 'operativo'},
    '78111808': {'id': 'taxis_plataformas', 'nombre': 'Plataformas de Movilidad y Taxis', 'icono': '🚕', 'color': '#f59e0b', 'tipo': 'viaticos'},
    '78111802': {'id': 'transporte_pasajeros', 'nombre': 'Transporte de Pasajeros y Autobuses', 'icono': '🚌', 'color': '#0284c7', 'tipo': 'viaticos'},
    '78102200': {'id': 'paqueteria_envios', 'nombre': 'Paquetería y Logística de Envíos', 'icono': '📦', 'color': '#f59e0b', 'tipo': 'operativo'},
    '78102205': {'id': 'mensajeria_entregas', 'nombre': 'Mensajería y Entregas Locales', 'icono': '🛵', 'color': '#f59e0b', 'tipo': 'operativo'},
    '78101802': {'id': 'fletes_envios', 'nombre': 'Fletes y Transporte de Carga', 'icono': '🚚', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '95111602': {'id': 'casetas_peajes', 'nombre': 'Casetas, Peajes y Autopistas', 'icono': '🛣️', 'color': '#64748b', 'tipo': 'viaticos'},

    '70122009': {'id': 'veterinaria_animales', 'nombre': 'Servicios Veterinarios y Cuidado Animal', 'icono': '🐾', 'color': '#10b981', 'tipo': 'operativo'},
    '70122000': {'id': 'veterinaria_animales', 'nombre': 'Servicios Veterinarios y Cuidado Animal', 'icono': '🐾', 'color': '#10b981', 'tipo': 'operativo'},

    '80131502': {'id': 'arrendamiento_inmuebles', 'nombre': 'Renta de Inmuebles y Oficinas', 'icono': '🏢', 'color': '#15803d', 'tipo': 'operativo'},
    '80131500': {'id': 'arrendamiento_inmuebles', 'nombre': 'Renta de Inmuebles y Oficinas', 'icono': '🏢', 'color': '#15803d', 'tipo': 'operativo'},

    '80161505': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '84131500': {'id': 'seguros_polizas', 'nombre': 'Seguros y Fianzas', 'icono': '🛡️', 'color': '#0d9488', 'tipo': 'operativo'},
    '84121500': {'id': 'servicios_financieros', 'nombre': 'Servicios Bancarios y Financieros', 'icono': '🏦', 'color': '#6366f1', 'tipo': 'financiero'},
    '84111506': {'id': 'servicios_facturacion', 'nombre': 'Servicios de Facturación y Finanzas', 'icono': '🧾', 'color': '#6366f1', 'tipo': 'operativo'},

    '15101514': {'id': 'combustibles', 'nombre': 'Combustibles y Gasolinas', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},
    '15101515': {'id': 'combustibles', 'nombre': 'Combustibles y Gasolinas', 'icono': '⛽', 'color': '#f97316', 'tipo': 'operativo'},

    '80141600': {'id': 'servicios_profesionales', 'nombre': 'Servicios Profesionales y Asesoría', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '80101500': {'id': 'consultoria_gestion', 'nombre': 'Consultoría y Gestión de Negocios', 'icono': '💼', 'color': '#059669', 'tipo': 'operativo'},
    '81112200': {'id': 'software_saas', 'nombre': 'Software, Licencias y SaaS', 'icono': '💻', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '81112000': {'id': 'servicios_nube', 'nombre': 'Hosting, Nube e Infraestructura TI', 'icono': '🌐', 'color': '#8b5cf6', 'tipo': 'operativo'},
    '43211500': {'id': 'computo_hardware', 'nombre': 'Equipo de Cómputo y Hardware', 'icono': '💻', 'color': '#0ea5e9', 'tipo': 'inversion'},
    '90101500': {'id': 'restaurantes_alimentos', 'nombre': 'Restaurantes y Alimentos', 'icono': '🍽️', 'color': '#d97706', 'tipo': 'viaticos'},
    '90111500': {'id': 'hoteles_hospedaje', 'nombre': 'Hoteles y Hospedaje', 'icono': '🏨', 'color': '#d97706', 'tipo': 'viaticos'},
}

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
                clave = str(item.get("id", "")).strip()
                if clave:
                    _CATALOGO_DICT[clave] = {
                        "clave": clave,
                        "descripcion": item.get("descripcion", "").strip(),
                        "palabras_similares": item.get("palabrasSimilares", "").strip(),
                        "segmento": clave[:2] if len(clave) >= 2 else "",
                        "familia": clave[:4] if len(clave) >= 4 else "",
                        "clase": clave[:6] if len(clave) >= 6 else ""
                    }
        except Exception as e:
            print(f"[SAT Catalogo] Error cargando JSON en memoria: {e}")


# Inicializar en memoria
_cargar_catalogo_json()


def get_clave_sat_info(clave: str) -> Optional[Dict[str, Any]]:
    """Consulta la descripción oficial y metadatos de una clave de 8 dígitos del SAT en memoria O(1)."""
    if not clave:
        return None
    return _CATALOGO_DICT.get(str(clave).strip())


def poblar_catalogo_db(db: Session) -> int:
    """
    Sincroniza y puebla la tabla `catalogo_sat_claves` en la Base de Datos con el merge de:
    - 52,514 Claves Oficiales SAT
    - Familias y Segmentos
    - Taxonomía Contable y Visual (Iconos, Colores, Nombres)
    """
    from app.models import CatalogoSatClave

    # 1. Verificar si ya está poblado
    conteo = db.query(CatalogoSatClave).count()
    if conteo >= 50000:
        return conteo

    registros = []

    # A. Insertar Segmentos (2 dígitos)
    for seg, info in TAXONOMIA_SEGMENTOS.items():
        registros.append(CatalogoSatClave(
            clave=seg,
            nivel="segmento",
            categoria_id=info["id"],
            nombre=info["nombre"],
            icono=info["icono"],
            color=info["color"],
            descripcion_sat=f"Segmento SAT {seg}: {info['nombre']}",
            tipo_gasto=info.get("tipo", "operativo")
        ))

    # B. Insertar Familias (4 dígitos)
    for fam, info in TAXONOMIA_FAMILIAS.items():
        registros.append(CatalogoSatClave(
            clave=fam,
            nivel="familia",
            categoria_id=info["id"],
            nombre=info["nombre"],
            icono=info["icono"],
            color=info["color"],
            descripcion_sat=f"Familia SAT {fam}: {info['nombre']}",
            tipo_gasto=info.get("tipo", "operativo")
        ))

    # C. Insertar Claves Específicas de 8 dígitos prioritarias
    for c_esp, info in TAXONOMIA_CLAVES_ESPECIFICAS.items():
        sat_info = _CATALOGO_DICT.get(c_esp, {})
        registros.append(CatalogoSatClave(
            clave=c_esp,
            nivel="producto",
            categoria_id=info["id"],
            nombre=info["nombre"],
            icono=info["icono"],
            color=info["color"],
            descripcion_sat=sat_info.get("descripcion") or info["nombre"],
            palabras_similares=sat_info.get("palabras_similares"),
            tipo_gasto=info.get("tipo", "operativo")
        ))

    # D. Mergear todas las 52,514 claves oficiales del JSON
    claves_ya_registradas = {r.clave for r in registros}
    for clave, sat_info in _CATALOGO_DICT.items():
        if clave in claves_ya_registradas:
            continue
        
        # Resolver su categoría taxonómica por familia o segmento
        fam = sat_info.get("familia", "")
        seg = sat_info.get("segmento", "")

        if fam in TAXONOMIA_FAMILIAS:
            cat_match = TAXONOMIA_FAMILIAS[fam]
        elif seg in TAXONOMIA_SEGMENTOS:
            cat_match = TAXONOMIA_SEGMENTOS[seg]
        else:
            cat_match = {
                "id": f"sat_{fam or seg or 'gen'}",
                "nombre": sat_info.get("descripcion", "Gasto General")[:45],
                "icono": "📋",
                "color": "#475569",
                "tipo": "operativo"
            }

        registros.append(CatalogoSatClave(
            clave=clave,
            nivel="producto",
            categoria_id=cat_match["id"],
            nombre=cat_match["nombre"],
            icono=cat_match["icono"],
            color=cat_match["color"],
            descripcion_sat=sat_info.get("descripcion", ""),
            palabras_similares=sat_info.get("palabras_similares", ""),
            tipo_gasto=cat_match.get("tipo", "operativo")
        ))

    try:
        db.bulk_save_objects(registros)
        db.commit()
        return len(registros)
    except Exception as e:
        db.rollback()
        print(f"[SAT Catalogo DB] Error en bulk_save: {e}")
        return 0


def resolver_partida_sat(clave_sat: str = "", desc_concepto: str = "", uso_cfdi: str = "") -> Dict[str, Any]:
    """
    Función universal para clasificar cualquier artículo / concepto fiscal
    mediante resolución jerárquica (8 -> 6 -> 4 -> 2 dígitos) y semántica.
    """
    clave = str(clave_sat or "").strip()

    # 1. Búsqueda exacta 8 dígitos en definiciones prioritarias
    if clave in TAXONOMIA_CLAVES_ESPECIFICAS:
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS[clave])

    # 2. Búsqueda en catálogo oficial SAT en RAM
    sat_info = get_clave_sat_info(clave)
    if sat_info:
        fam = sat_info.get("familia", "")
        if fam in TAXONOMIA_FAMILIAS:
            res = dict(TAXONOMIA_FAMILIAS[fam])
            res["descripcion_sat"] = sat_info.get("descripcion")
            return res

        seg = sat_info.get("segmento", "")
        if seg in TAXONOMIA_SEGMENTOS:
            res = dict(TAXONOMIA_SEGMENTOS[seg])
            res["descripcion_sat"] = sat_info.get("descripcion")
            return res

        return {
            "id": f"sat_{fam or seg or 'gen'}",
            "nombre": sat_info.get("descripcion", "Gasto General")[:45],
            "icono": "📋",
            "color": "#475569",
            "descripcion_sat": sat_info.get("descripcion", ""),
            "tipo": "operativo"
        }

    # 3. Fallback jerárquico por longitud
    if len(clave) >= 6 and clave[:6] in TAXONOMIA_CLAVES_ESPECIFICAS:
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS[clave[:6]])
    if len(clave) >= 4 and clave[:4] in TAXONOMIA_FAMILIAS:
        return dict(TAXONOMIA_FAMILIAS[clave[:4]])
    if len(clave) >= 2 and clave[:2] in TAXONOMIA_SEGMENTOS:
        return dict(TAXONOMIA_SEGMENTOS[clave[:2]])

    # 4. Análisis por Uso de CFDI de Activos Fijos
    if uso_cfdi in ["I04"]:
        return dict(TAXONOMIA_SEGMENTOS["43"])
    elif uso_cfdi in ["I03"]:
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["78111811"])
    elif uso_cfdi in ["I01", "I02"]:
        return dict(TAXONOMIA_SEGMENTOS["56"])

    # 5. Análisis semántico por descripción del concepto
    desc = str(desc_concepto or "").upper()
    if any(k in desc for k in ["VETERINARI", "HOSPITAL VETERINARIO", "ANIMAL", "MASCOTA", "PERRO", "GATO"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["70122009"])
    if any(k in desc for k in ["AVION", "VUELO", "AEROLINEA", "BOLETO DE AVION", "AEROMEXICO", "VOLARIS", "VIVAEROBUS"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["78111502"])
    if any(k in desc for k in ["PAQUETERIA", "ENVIO", "LOGISTICA", "GUIA", "RASTREO"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["78102200"])
    if any(k in desc for k in ["ARRENDAMIENTO DE AUTO", "RENTA DE AUTO", "LEASING"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["78111811"])
    if any(k in desc for k in ["UBER", "DIDI", "TARIFA", "CUOTA DE SOLICITUD", "TAXI"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["78111808"])
    if any(k in desc for k in ["GASOLINA", "COMBUSTIBLE"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["15101514"])
    if any(k in desc for k in ["CASETA", "PEAJE", "TAG", "TELEVIA", "AUTOPISTA"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["95111602"])
    if any(k in desc for k in ["SEGURO", "POLIZA", "COBERTURA", "FIANZA"]):
        return dict(TAXONOMIA_CLAVES_ESPECIFICAS["80161505"])
    if any(k in desc for k in ["INTERES", "COMISION", "MANEJO DE CUENTA", "FINANCIERO", "BANCO"]):
        return dict(TAXONOMIA_SEGMENTOS["84"])
    if any(k in desc for k in ["HONORARIOS", "ASESORIA", "CONSULTORIA", "ADMINISTRACION", "LEGAL", "CONTABLE", "AUDITORIA"]):
        return dict(TAXONOMIA_SEGMENTOS["80"])
    if any(k in desc for k in ["HOSTING", "DOMINIO", "NUBE", "SOFTWARE", "LICENCIA", "INTERNET", "TELEFONIA", "TELECOMUNICACIONES"]):
        return dict(TAXONOMIA_SEGMENTOS["81"])
    if any(k in desc for k in ["COMPUTADORA", "LAPTOP", "MONITOR", "DISCO DURO", "MEMORIA", "ELECTRONICA", "HARDWARE", "CABLE"]):
        return dict(TAXONOMIA_SEGMENTOS["43"])
    if any(k in desc for k in ["RESTAURANTE", "ALIMENTOS", "CONSUMO", "HOTEL", "HOSPEDAJE", "CAFE"]):
        return dict(TAXONOMIA_SEGMENTOS["90"])
    if any(k in desc for k in ["PAPELERIA", "TONER", "TINTA", "HOJAS", "OFICINA"]):
        return dict(TAXONOMIA_SEGMENTOS["44"])

    return {
        "id": "otros_operativos",
        "nombre": "Otros Gastos Operativos",
        "icono": "📋",
        "color": "#64748b",
        "tipo": "operativo"
    }


def get_taxonomia_completa() -> Dict[str, Any]:
    """Retorna la taxonomía completa para alimentar endpoints y el frontend."""
    return {
        "segmentos": TAXONOMIA_SEGMENTOS,
        "familias": TAXONOMIA_FAMILIAS,
        "claves_especificas": TAXONOMIA_CLAVES_ESPECIFICAS
    }

