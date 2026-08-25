"""
Calculadora de Nómina y Sueldos y Salarios (CFDI de Nómina 1.2).
Procesa percepciones gravadas, exentas, desglose de prestaciones de previsión social y deducciones de ISR.
"""

from typing import Dict, List, Any, Set

IGNORED_UUIDS: Set[str] = {
    '9CA1819A-BA40-4179-84A2-AFCBF5E885F3',  # Cancelled MATTILDA payroll CFDI replaced by severance
}


def calcular_nomina(all_cfdis: List[Dict[str, Any]], year: str) -> Dict[str, Any]:
    """
    Calcula los totales de Sueldos y Salarios para un ejercicio fiscal:
    - Agrupación por empleador/patrón (RFC / Razón Social)
    - Desglose de percepciones gravadas y exentas (Aguinaldo, PTU, Primas)
    - Retenciones de ISR
    - Recibos individuales ordenados cronológicamente
    """
    nomina_items = [
        i for i in all_cfdis
        if i.get('categoria') == 'nomina' and (i.get('fecha') or '').startswith(year)
    ]

    det_ex = {
        'aguinaldo': 0.0,
        'ptu': 0.0,
        'prima_vacacional': 0.0,
        'prima_dominical': 0.0,
        'otros': 0.0,
        'desglose_otros': []
    }
    by_emp: Dict[str, Dict[str, Any]] = {}

    for i in nomina_items:
        if i.get('uuid') in IGNORED_UUIDS:
            continue

        key = i.get('emisor_rfc') or i.get('emisor_nombre', 'Desconocido')
        if key not in by_emp:
            by_emp[key] = {
                'nombre_display': i.get('emisor_nombre') or key,
                'rfc': key,
                'gravado_raw': 0.0,
                'prevision_social_exenta': 0.0,
                'gravado': 0.0,
                'exento': 0.0,
                'isr': 0.0,
                'detalle_exento': {
                    'aguinaldo': 0.0,
                    'ptu': 0.0,
                    'prima_vacacional': 0.0,
                    'prima_dominical': 0.0,
                    'otros': 0.0,
                    'desglose_otros': []
                },
                'recibos': []
            }
        else:
            current_name = by_emp[key]['nombre_display']
            new_name = i.get('emisor_nombre')
            if new_name and len(new_name) < len(current_name):
                by_emp[key]['nombre_display'] = new_name

        g_raw = float(i.get('nomina_gravado') or 0.0)
        e_raw = float(i.get('nomina_exento') or 0.0)
        r_raw = float(i.get('retencion_isr') or 0.0)

        by_emp[key]['gravado_raw'] += g_raw
        by_emp[key]['exento'] += e_raw
        by_emp[key]['isr'] += r_raw

        # Previsión social y vales de despensa
        percs_det = i.get('percepciones_detalle') or []
        for p in percs_det:
            tipo = p.get('tipo')
            if tipo in ('029', '005'):
                by_emp[key]['prevision_social_exenta'] += float(p.get('exento') or 0.0)

        d = i.get('nomina_detalle_exento') or {}
        for k in ['aguinaldo', 'ptu', 'prima_vacacional', 'prima_dominical', 'otros']:
            val_ex = float(d.get(k, 0.0) or 0.0)
            det_ex[k] += val_ex
            by_emp[key]['detalle_exento'][k] += val_ex

        if d.get('desglose_otros'):
            det_ex['desglose_otros'].extend(d.get('desglose_otros', []))
            by_emp[key]['detalle_exento']['desglose_otros'].extend(d.get('desglose_otros', []))

        dias_pagados = float(i.get('num_dias_pagados') or 0.0)
        vales = sum(float(p.get('total') or 0.0) for p in percs_det if p.get('tipo') == '029')

        recibo = {
            'uuid': i.get('uuid'),
            'fecha': i.get('fecha_pago_nomina') or (i.get('fecha') or '')[:10],
            'fecha_inicial': i.get('fecha_inicial_pago'),
            'fecha_final': i.get('fecha_final_pago'),
            'dias_pagados': dias_pagados,
            'total_bruto': float(i.get('subtotal') or (g_raw + e_raw)),
            'total_deducciones': float(i.get('descuento') or r_raw),
            'vales': vales,
            'neto': round(float(i.get('total') or (g_raw + e_raw - r_raw)) - vales, 2),
            'isr_retenido': r_raw,
            'gravado': g_raw,
            'exento': e_raw,
            'percepciones': percs_det if percs_det else [
                {'tipo': '001', 'concepto': 'Sueldos y Salarios', 'gravado': g_raw, 'exento': e_raw, 'total': g_raw + e_raw}
            ],
            'deducciones': i.get('deducciones_detalle') or [{'tipo': '002', 'concepto': 'ISR Retenido', 'importe': r_raw}],
            'salario_base_cot_apor': i.get('salario_base_cot_apor'),
            'salario_diario_integrado': i.get('salario_diario_integrado'),
            'raw_cfdi': i
        }
        by_emp[key]['recibos'].append(recibo)

    tg = 0.0
    te = 0.0
    isr_n = 0.0
    for k, v in by_emp.items():
        if year == '2025':
            v['gravado'] = max(0.0, v['gravado_raw'] - v['prevision_social_exenta'])
        else:
            v['gravado'] = v['gravado_raw']
        v['total'] = round(v['gravado'] + v['exento'], 2)
        tg += v['gravado']
        te += v['exento']
        isr_n += v['isr']

    for e_key in by_emp:
        by_emp[e_key]['recibos'].sort(key=lambda r: r.get('fecha_final') or r.get('fecha') or '')

    return {
        'total_gravado': round(tg, 2),
        'total_exento': round(te, 2),
        'total_ingresos': round(tg + te, 2),
        'isr_retenido': round(isr_n, 2),
        'detalle_exento': det_ex,
        'by_employer': by_emp
    }
