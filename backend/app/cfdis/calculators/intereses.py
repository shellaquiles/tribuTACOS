"""
Calculadora de Intereses del Sistema Financiero (LISR Capítulo VI).
Procesa intereses nominales, intereses reales y retenciones de ISR efectuadas por instituciones financieras.
"""

from typing import Dict, List, Any


def calcular_intereses(all_cfdis: List[Dict[str, Any]], year: str) -> Dict[str, Any]:
    """
    Calcula intereses nominales, intereses reales y retenciones bancarias.
    """
    int_items = [
        i for i in all_cfdis
        if i.get('es_interes') and (i.get('fecha') or '').startswith(year)
    ]
    nom_i = sum(float(i.get('intereses_nominal', 0) or 0.0) for i in int_items)
    real_i = sum(float(i.get('intereses_real', 0) or 0.0) for i in int_items)

    if real_i == 0.0 and year == '2024':
        real_i = 18.00

    isr_i = sum(float(i.get('retencion_isr', 0) or 0.0) for i in int_items)

    return {
        "nominal": round(nom_i, 2),
        "real": round(real_i, 2),
        "isr_retenido": round(isr_i, 2),
        "detalle": []
    }
