"""
Calculadora de Deducciones Personales en Declaración Anual (LISR Art. 151).
Evalúa claves D01 a D10, motivos de observación (efectivo, clave 99, farmacias fuera de hospital)
y aplica topes de ley (5 UMA anuales vs 15% de los ingresos acumulables).
"""

from typing import Dict, List, Any, Optional
from app.cfdis.calculators.tarifas import UMA_5_ANUAL_FALLBACK

CAT_DEDUCCIONES: Dict[str, Dict[str, str]] = {
    'D01': {'nombre': 'Honorarios médicos, dentales y hospitalarios', 'icon': '🏥'},
    'D02': {'nombre': 'Gastos médicos por incapacidad / ópticos', 'icon': '👓'},
    'D03': {'nombre': 'Gastos funerales', 'icon': '⚰️'},
    'D04': {'nombre': 'Donativos no onerosos', 'icon': '🎗️'},
    'D05': {'nombre': 'Intereses reales crédito hipotecario', 'icon': '🏠'},
    'D06': {'nombre': 'Aportaciones voluntarias al SAR / Afore / PPR', 'icon': '🎓'},
    'D07': {'nombre': 'Primas por seguros de gastos médicos', 'icon': '💊'},
    'D08': {'nombre': 'Gastos de transportación escolar obligatoria', 'icon': '🚌'},
    'D09': {'nombre': 'Depósitos en cuentas especiales para el ahorro', 'icon': '🏦'},
    'D10': {'nombre': 'Pagos por servicios educativos (Colegiaturas)', 'icon': '🏫'},
}


def calcular_deducciones_personales(
    all_cfdis: List[Dict[str, Any]],
    year: str,
    total_ingresos_ejercicio: float,
    constancias_externas: Optional[List[Dict[str, Any]]] = None,
    uma_5_anual: Optional[float] = None
) -> Dict[str, Any]:
    """
    Procesa las facturas recibidas con uso de CFDI tipo D (D01-D10):
    - Filtra deducciones válidas vs observadas
    - Agrega constancias y comprobantes fiscales externos registrados en base de datos
    - Agrupa por tipo de deducción
    - Aplica topes de Ley del ISR (Art. 151 último párrafo)
    """
    pers_d_raw = [
        i for i in all_cfdis
        if (i.get('uso_cfdi') or '').startswith('D') and (i.get('fecha') or '').startswith(year)
    ]

    # Incorporar constancias fiscales externas provenientes de BD
    if constancias_externas:
        for c in constancias_externas:
            # Asegurar que coincida con el año o fecha
            c_fecha = c.get('fecha') or f"{year}-12-31"
            if c_fecha.startswith(year):
                pers_d_raw.append({
                    'uuid': c.get('id') or c.get('uuid'),
                    'emisor_rfc': c.get('emisor_rfc'),
                    'emisor_nombre': c.get('emisor_nombre'),
                    'fecha': c_fecha,
                    'uso_cfdi': c.get('uso_cfdi', 'D06'),
                    'subtotal': float(c.get('monto') or 0.0),
                    'forma_pago': c.get('forma_pago', '03'),
                    'metodo_pago': c.get('metodo_pago', 'PUE'),
                    'conceptos': c.get('conceptos') or [{
                        'desc': c.get('descripcion') or 'Constancia externa deducible',
                        'imp': float(c.get('monto') or 0.0)
                    }]
                })

    pers_d_validas = []
    pers_d_observadas = []
    pers_d_por_uso = {k: 0.0 for k in CAT_DEDUCCIONES.keys()}

    for item in pers_d_raw:
        uso = item.get('uso_cfdi', 'D01')
        sub = float(item.get('subtotal') or 0.0)
        forma = str(item.get('forma_pago') or 'N/A')
        emisor_nom = (item.get('emisor_nombre') or item.get('emisor_rfc') or 'Desconocido').upper()

        motivos_rechazo = []
        if forma == '01':
            motivos_rechazo.append('Pagado en Efectivo (01): El SAT exige pago electrónico para deducción personal')
        elif forma == '99':
            motivos_rechazo.append('Forma Por Definir (99): Requiere complemento de pago bancarizado para ser deducible')

        if ('PHARMA PLUS' in emisor_nom or 'FARMACIA' in emisor_nom or 'BENAVIDES' in emisor_nom) and 'INSIGNIA' not in emisor_nom:
            if uso in ('D01', 'D02'):
                motivos_rechazo.append('Farmacia comercial: Los medicamentos solo son deducibles si se facturan dentro de un comprobante hospitalario')

        cfdi_row = {
            "uuid": item.get('uuid'),
            "emisor": item.get('emisor_nombre') or item.get('emisor_rfc'),
            "rfc_emisor": item.get('emisor_rfc'),
            "fecha": (item.get('fecha') or '')[:10],
            "uso_cfdi": uso,
            "uso_nombre": CAT_DEDUCCIONES.get(uso, {}).get('nombre', uso),
            "uso_icon": CAT_DEDUCCIONES.get(uso, {}).get('icon', '📄'),
            "monto": round(sub, 2),
            "forma_pago": forma,
            "metodo_pago": item.get('metodo_pago', 'PUE'),
            "conceptos": item.get('conceptos', []),
            "raw_cfdi": item
        }

        if not motivos_rechazo:
            pers_d_validas.append(cfdi_row)
            pers_d_por_uso[uso] = pers_d_por_uso.get(uso, 0.0) + sub
        else:
            cfdi_row["motivos_rechazo"] = motivos_rechazo
            pers_d_observadas.append(cfdi_row)

    pers_d_total_valido = sum(x['monto'] for x in pers_d_validas)
    pers_d_total_observado = sum(x['monto'] for x in pers_d_observadas)

    limite_15_pct = total_ingresos_ejercicio * 0.15
    limite_5_umas = uma_5_anual if uma_5_anual is not None else UMA_5_ANUAL_FALLBACK.get(year, 198031.80)
    tope_legal = min(limite_15_pct, limite_5_umas) if total_ingresos_ejercicio > 0 else limite_5_umas
    monto_deducible_efectivo = min(pers_d_total_valido, tope_legal)

    return {
        "total": round(monto_deducible_efectivo, 2),
        "total_valido_bruto": round(pers_d_total_valido, 2),
        "total_observado": round(pers_d_total_observado, 2),
        "por_uso": {k: round(v, 2) for k, v in pers_d_por_uso.items()},
        "detalle": pers_d_validas,
        "observadas": pers_d_observadas,
        "posibles_no_clasificadas": [],
        "tope": {
            "limite_15_pct": round(limite_15_pct, 2),
            "limite_5_umas": round(limite_5_umas, 2),
            "tope_aplicable": round(tope_legal, 2),
            "monto_aplicado": round(monto_deducible_efectivo, 2),
            "remanente_disponible": max(0.0, round(tope_legal - pers_d_total_valido, 2)),
            "porcentaje_aprovechado": min(100.0, round((pers_d_total_valido / tope_legal * 100) if tope_legal > 0 else 0, 1))
        }
    }
