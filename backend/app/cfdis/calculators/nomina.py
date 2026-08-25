"""
Calculadora de Nómina y Sueldos y Salarios (CFDI de Nómina 1.2).
Procesa percepciones gravadas, exentas, desglose de prestaciones de previsión social y deducciones de ISR.
Genera series analíticas mensuales y salarios de referencia para consumo directo de UI.
"""

from typing import Dict, List, Any, Set, Optional


def calcular_nomina(
    all_cfdis: List[Dict[str, Any]],
    year: str,
    ignored_uuids: Optional[Set[str]] = None
) -> Dict[str, Any]:
    """
    Calcula los totales de Sueldos y Salarios para un ejercicio fiscal:
    - Agrupación por empleador/patrón (RFC / Razón Social)
    - Desglose de percepciones gravadas y exentas (Aguinaldo, PTU, Primas)
    - Retenciones de ISR
    - Recibos individuales ordenados cronológicamente
    - Pre-cálculo de analítica mensual (12 meses) y salarios de referencia
    """
    ignored = ignored_uuids or set()
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
    all_valid_recibos: List[Dict[str, Any]] = []

    for i in nomina_items:
        uuid = i.get('uuid')
        if uuid and uuid in ignored:
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
            'uuid': uuid,
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
        all_valid_recibos.append(recibo)

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

    # ─── PRE-CÁLCULO DE SERIE ANALÍTICA MENSUAL (12 MESES) ───
    m_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    nomina_mensual_resumen = []
    for idx, m_name in enumerate(m_labels):
        mes_num = idx + 1
        recibos_mes = [
            r for r in all_valid_recibos
            if r.get('fecha') and len(r['fecha'].split('-')) > 1 and int(r['fecha'].split('-')[1]) == mes_num
        ]
        bruto_mes = sum(r.get('total_bruto') or 0.0 for r in recibos_mes)
        isr_mes = sum(r.get('isr_retenido') or 0.0 for r in recibos_mes)
        neto_mes = sum(r.get('neto') or 0.0 for r in recibos_mes)
        otras_ded = max(0.0, round((bruto_mes - isr_mes - neto_mes), 2))

        nomina_mensual_resumen.append({
            'name': m_name,
            'mes_num': mes_num,
            'Neto en Cuenta': round(neto_mes, 2),
            'ISR Retenido': round(isr_mes, 2),
            'Otras Retenciones': round(otras_ded, 2),
            'Sueldo Bruto': round(bruto_mes, 2),
            'recibos_count': len(recibos_mes)
        })

    # Resumen de Percepciones y Deducciones agrupadas por clave
    percepciones_dict: Dict[str, Dict[str, Any]] = {}
    deducciones_dict: Dict[str, Dict[str, Any]] = {}

    for r in all_valid_recibos:
        for p in r.get('percepciones') or []:
            tipo = p.get('tipo') or 'S/C'
            if tipo not in percepciones_dict:
                percepciones_dict[tipo] = {'clave': tipo, 'total': 0.0, 'gravado': 0.0, 'exento': 0.0, 'items': set()}
            percepciones_dict[tipo]['total'] += float(p.get('total') or (float(p.get('gravado') or 0) + float(p.get('exento') or 0)))
            percepciones_dict[tipo]['gravado'] += float(p.get('gravado') or 0.0)
            percepciones_dict[tipo]['exento'] += float(p.get('exento') or 0.0)
            if p.get('concepto'):
                percepciones_dict[tipo]['items'].add(p.get('concepto').strip())

        for d in r.get('deducciones') or []:
            tipo = d.get('tipo') or 'S/C'
            if tipo not in deducciones_dict:
                deducciones_dict[tipo] = {'clave': tipo, 'total': 0.0, 'items': set()}
            deducciones_dict[tipo]['total'] += float(d.get('importe') or d.get('total') or 0.0)
            if d.get('concepto'):
                deducciones_dict[tipo]['items'].add(d.get('concepto').strip())

    percepciones_por_tipo = [
        {**v, 'items': list(v['items'])}
        for v in sorted(percepciones_dict.values(), key=lambda x: x['total'], reverse=True)
    ]
    deducciones_por_tipo = [
        {**v, 'items': list(v['items'])}
        for v in sorted(deducciones_dict.values(), key=lambda x: x['total'], reverse=True)
    ]

    total_bruto = sum(p['total'] for p in percepciones_por_tipo)
    total_deducciones = sum(d['total'] for d in deducciones_por_tipo)
    total_vales = next((p['total'] for p in percepciones_por_tipo if p['clave'] == '029'), 0.0)

    # Días totales y cálculo de promedios
    recibos_con_sueldo = [r for r in all_valid_recibos if any(p.get('tipo') == '001' for p in (r.get('percepciones') or []))]
    total_dias = sum(float(r.get('dias_pagados') or 0.0) for r in recibos_con_sueldo)
    meses_laborados = round(total_dias / 30.0, 1) if total_dias > 0 else (round(len(all_valid_recibos) / 2.0, 1) if all_valid_recibos else 1.0)

    return {
        'total_gravado': round(tg, 2),
        'total_exento': round(te, 2),
        'total_ingresos': round(tg + te, 2),
        'isr_retenido': round(isr_n, 2),
        'total_bruto': round(total_bruto, 2),
        'total_deducciones': round(total_deducciones, 2),
        'total_vales': round(total_vales, 2),
        'neto': round(total_bruto - total_deducciones - total_vales, 2),
        'meses_laborados': meses_laborados,
        'total_dias_pagados': total_dias,
        'detalle_exento': det_ex,
        'by_employer': by_emp,
        'nomina_mensual_resumen': nomina_mensual_resumen,
        'percepciones_por_tipo': percepciones_por_tipo,
        'deducciones_por_tipo': deducciones_por_tipo
    }
