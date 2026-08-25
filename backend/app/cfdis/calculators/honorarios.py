"""
Calculadora de Ingresos por Honorarios y Actividad Empresarial (PFAE - LISR).
Procesa facturas emitidas (ingresos), retenciones de ISR e IVA, notas de crédito emitidas y agrupación por RFC.
Pre-calcula series analíticas mensuales, concentración de clientes y mix de conceptos para frontend.
"""

from typing import Dict, List, Any
from app.cfdis.calculators.tarifas import MES_NAMES


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
    - Pre-cálculo de analítica mensual y concentración por clientes
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
    clientes_map: Dict[str, Dict[str, Any]] = {}
    service_mix_map: Dict[str, Dict[str, Any]] = {}

    for i in emitidos_ingreso:
        fecha = i.get('fecha') or ''
        if not fecha.startswith(year):
            continue
        try:
            m = int(fecha.split('-')[1])
            sub = float(i.get('subtotal') or 0.0)
            iva_val = float(i.get('iva', 0.0) or 0.0)
            ret_isr_val = float(i.get('retencion_isr', 0.0) or 0.0)
            ret_iva_val = float(i.get('retencion_iva', 0.0) or 0.0)
            total_val = float(i.get('total', 0.0) or 0.0)

            mensual_pfae[m]['ingresos'] += sub
            mensual_pfae[m]['iva_tras'] += iva_val
            mensual_pfae[m]['isr_ret'] += ret_isr_val
            mensual_pfae[m]['iva_ret'] += ret_iva_val

            cliente_nombre = i.get('receptor_nombre') or i.get('receptor_rfc') or 'Público en General'
            cliente_rfc = i.get('receptor_rfc') or 'XAXX010101000'
            cliente_key = cliente_rfc

            # Agrupar clientes
            if cliente_key not in clientes_map:
                clientes_map[cliente_key] = {
                    'rfc': cliente_rfc,
                    'nombre': cliente_nombre,
                    'subtotal': 0.0,
                    'iva': 0.0,
                    'total': 0.0,
                    'facturas_count': 0
                }
            else:
                if cliente_nombre and len(cliente_nombre) < len(clientes_map[cliente_key]['nombre']):
                    clientes_map[cliente_key]['nombre'] = cliente_nombre

            clientes_map[cliente_key]['subtotal'] += sub
            clientes_map[cliente_key]['iva'] += iva_val
            clientes_map[cliente_key]['total'] += total_val
            clientes_map[cliente_key]['facturas_count'] += 1

            conceptos_list = i.get('conceptos', [])
            for c in conceptos_list:
                clave = c.get('clave') or '00000000'
                label = c.get('desc_sat') or c.get('desc') or clave
                if clave not in service_mix_map:
                    service_mix_map[clave] = {
                        'clave': clave,
                        'name': label[:45] + '...' if len(label) > 45 else label,
                        'value': 0.0,
                        'count': 0
                    }
                service_mix_map[clave]['value'] += float(c.get('imp') or 0.0)
                service_mix_map[clave]['count'] += 1

            lista_honorarios.append({
                'fecha': fecha[:10],
                'receptor': cliente_nombre,
                'cliente': cliente_nombre,
                'rfc': cliente_rfc,
                'subtotal': sub,
                'iva': iva_val,
                'ret_isr': ret_isr_val,
                'isr_ret': ret_isr_val,
                'ret_iva': ret_iva_val,
                'iva_ret': ret_iva_val,
                'total': total_val,
                'uuid': i.get('uuid'),
                'conceptos': conceptos_list
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

    total_ingresos = sum(v['ingresos'] for v in mensual_pfae.values())
    total_isr_ret = sum(v['isr_ret'] for v in mensual_pfae.values())
    total_iva_ret = sum(v['iva_ret'] for v in mensual_pfae.values())
    total_iva_tras = sum(v['iva_tras'] for v in mensual_pfae.values())

    # Serie analítica de 12 meses lista para ComposedChart
    m_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    analitica_mensual = [
        {
            'name': m_labels[m - 1],
            'mes_num': m,
            'Subtotal': round(mensual_pfae[m]['ingresos'], 2),
            'IVA': round(mensual_pfae[m]['iva_tras'], 2),
            'Neto': round(mensual_pfae[m]['ingresos'] + mensual_pfae[m]['iva_tras'] - mensual_pfae[m]['isr_ret'] - mensual_pfae[m]['iva_ret'], 2),
            'ISR Retenido': round(mensual_pfae[m]['isr_ret'], 2),
            'IVA Retenido': round(mensual_pfae[m]['iva_ret'], 2),
        }
        for m in range(1, 13)
    ]

    top_clientes = sorted(
        [
            {
                **c,
                'subtotal': round(c['subtotal'], 2),
                'iva': round(c['iva'], 2),
                'total': round(c['total'], 2),
                'porcentaje': round((c['subtotal'] / total_ingresos * 100), 1) if total_ingresos > 0 else 0.0
            }
            for c in clientes_map.values()
        ],
        key=lambda x: x['subtotal'],
        reverse=True
    )

    mix_conceptos = sorted(
        [
            {**s, 'value': round(s['value'], 2)}
            for s in service_mix_map.values()
        ],
        key=lambda x: x['value'],
        reverse=True
    )

    return {
        'mensual_pfae': mensual_pfae,
        'lista_honorarios': lista_honorarios,
        'lista_conceptos': lista_hon_conceptos,
        'total_ingresos': round(total_ingresos, 2),
        'total_isr_ret': round(total_isr_ret, 2),
        'total_iva_ret': round(total_iva_ret, 2),
        'total_iva_tras': round(total_iva_tras, 2),
        'analitica_mensual': analitica_mensual,
        'top_clientes': top_clientes,
        'mix_conceptos': mix_conceptos
    }


def calcular_notas_credito(all_cfdis: List[Dict[str, Any]], year: str) -> Dict[str, Any]:
    """
    Procesa notas de crédito y descuentos recibidos/emitidos (tipo E).
    """
    otros_ingresos_items = [
        i for i in all_cfdis
        if i.get('categoria') == 'egreso_egreso' and (i.get('fecha') or '').startswith(year)
    ]
    tot_otros = sum(float(i.get('subtotal') or 0.0) for i in otros_ingresos_items)

    otros_conceptos: Dict[str, float] = {}
    for i in otros_ingresos_items:
        for c in i.get('conceptos', []):
            desc = (c.get('desc') or 'Bonificación/Devolución').strip().upper()
            otros_conceptos[desc] = otros_conceptos.get(desc, 0.0) + float(c.get('imp') or 0.0)

    resumen_conceptos = [{'concepto': k, 'importe': round(v, 2)} for k, v in otros_conceptos.items()]
    otros_ingresos_items.sort(key=lambda x: x.get('fecha', ''), reverse=True)

    return {
        'total': round(tot_otros, 2),
        'detalle': otros_ingresos_items,
        'resumen_conceptos': resumen_conceptos
    }
