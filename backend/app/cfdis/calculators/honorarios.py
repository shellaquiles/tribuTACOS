"""
Calculadora de Ingresos por Honorarios y Actividad Empresarial (PFAE - LISR).
Procesa facturas emitidas (ingresos), retenciones de ISR e IVA, notas de crédito emitidas y agrupación por RFC.
"""

from typing import Dict, List, Any


def calcular_honorarios(
    all_cfdis: List[Dict[str, Any]],
    year: str,
    user_rfc: str
) -> Dict[str, Any]:
    """
    Procesa facturas emitidas por el contribuyente para el ejercicio fiscal indicado:
    - Agrupación mensual de ingresos, IVA trasladado y retenciones
    - Listado de facturas emitidas con conceptos
    - Resumen de partidas/conceptos facturados
    """
    user_rfc_upper = user_rfc.upper()
    emitidos_ingreso = [
        i for i in all_cfdis
        if i.get('categoria') == 'ingreso' and (i.get('emisor_rfc') or '').upper() == user_rfc_upper
    ]

    mensual_pfae = {
        m: {
            'ingresos': 0.0,
            'iva_tras': 0.0,
            'isr_ret': 0.0,
            'iva_ret': 0.0,
            'egresos': 0.0,
            'egresos_deducibles': 0.0,
            'egresos_no_deducibles': 0.0,
            'iva_acred': 0.0,
            'iva_acred_fiscal': 0.0
        }
        for m in range(1, 13)
    }

    lista_honorarios = []
    for i in emitidos_ingreso:
        fecha = i.get('fecha') or ''
        if not fecha.startswith(year):
            continue
        try:
            m = int(fecha.split('-')[1])
            sub = float(i.get('subtotal') or 0.0)
            mensual_pfae[m]['ingresos'] += sub
            mensual_pfae[m]['iva_tras'] += float(i.get('iva') or 0.0)
            mensual_pfae[m]['isr_ret'] += float(i.get('retencion_isr') or 0.0)
            mensual_pfae[m]['iva_ret'] += float(i.get('retencion_iva') or 0.0)

            lista_honorarios.append({
                'fecha': fecha[:10],
                'receptor': i.get('receptor_nombre') or i.get('receptor_rfc'),
                'cliente': i.get('receptor_nombre') or i.get('receptor_rfc'),
                'rfc': i.get('receptor_rfc'),
                'subtotal': sub,
                'iva': float(i.get('iva', 0.0) or 0.0),
                'ret_isr': float(i.get('retencion_isr', 0.0) or 0.0),
                'isr_ret': float(i.get('retencion_isr', 0.0) or 0.0),
                'ret_iva': float(i.get('retencion_iva', 0.0) or 0.0),
                'iva_ret': float(i.get('retencion_iva', 0.0) or 0.0),
                'total': float(i.get('total', 0.0) or 0.0),
                'uuid': i.get('uuid'),
                'conceptos': i.get('conceptos', [])
            })
        except Exception:
            pass

    # Resumen agrupado por descripción de conceptos
    hon_conceptos: Dict[str, float] = {}
    for i in lista_honorarios:
        for c in i.get('conceptos', []):
            desc = (c.get('desc') or 'Servicios profesionales').strip().upper()
            hon_conceptos[desc] = hon_conceptos.get(desc, 0.0) + float(c.get('imp') or 0.0)

    lista_hon_conceptos = [{'concepto': k, 'importe': round(v, 2)} for k, v in hon_conceptos.items()]
    lista_honorarios.sort(key=lambda x: x['fecha'], reverse=True)

    return {
        'mensual_pfae': mensual_pfae,
        'lista_honorarios': lista_honorarios,
        'lista_conceptos': lista_hon_conceptos,
        'total_ingresos': sum(v['ingresos'] for v in mensual_pfae.values()),
        'total_isr_ret': sum(v['isr_ret'] for v in mensual_pfae.values()),
        'total_iva_ret': sum(v['iva_ret'] for v in mensual_pfae.values()),
        'total_iva_tras': sum(v['iva_tras'] for v in mensual_pfae.values()),
    }


def calcular_notas_credito(all_cfdis: List[Dict[str, Any]], year: str) -> Dict[str, Any]:
    """
    Procesa notas de crédito y descuentos recibidos/emitidos (tipo E).
    """
    otros_ingresos_items = [
        i for i in all_cfdis
        if i.get('categoria') == 'egreso_egreso' and (i.get('fecha') or '').startswith(year)
    ]
    lista_otros_ingresos = []
    total_otros_ingresos = 0.0

    for i in otros_ingresos_items:
        base_calc = float(i.get('subtotal') or 0.0) - float(i.get('descuento') or 0.0)
        total_otros_ingresos += base_calc
        lista_otros_ingresos.append({
            'fecha': (i.get('fecha') or '')[:10],
            'emisor': i.get('emisor_nombre') or i.get('emisor_rfc'),
            'subtotal': base_calc,
            'iva': float(i.get('iva', 0.0) or 0.0),
            'total': base_calc + float(i.get('iva', 0.0) or 0.0),
            'uuid': i.get('uuid'),
            'conceptos': i.get('conceptos', [])
        })

    return {
        'total': round(total_otros_ingresos, 2),
        'detalle': lista_otros_ingresos
    }
