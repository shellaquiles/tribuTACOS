import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models import Cfdi, Client, SummaryCache, DeclaracionAnualSAT, PagoProvisionalSAT

IGNORED_UUIDS = {
    '9CA1819A-BA40-4179-84A2-AFCBF5E885F3', # Cancelled MATTILDA payroll CFDI replaced by severance
}

UMA_5_ANUAL = {
    "2021": 163467.00,
    "2022": 175597.70,
    "2023": 189222.00,
    "2024": 198031.80,
    "2025": 206367.06,
    "2026": 215350.00,
}

CAT_DEDUCCIONES = {
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

# ─── TABLA DE TARIFA ANUAL DE ISR (ART. 152 LISR) ───
TARIFA_ANUAL_ISR = [
    (0.01, 8952.49, 0.00, 0.0192),
    (8952.50, 75984.55, 171.88, 0.0640),
    (75984.56, 133536.00, 4461.94, 0.1088),
    (133536.01, 155229.80, 10723.55, 0.1600),
    (155229.81, 185852.57, 14194.54, 0.1792),
    (185852.58, 374837.88, 19682.13, 0.2136),
    (374837.89, 590796.00, 60049.40, 0.2352),
    (590796.01, 1127926.84, 110842.74, 0.3000),
    (1127926.85, 1503902.46, 271981.99, 0.3200),
    (1503902.47, 4511707.37, 392294.17, 0.3400),
    (4511707.38, float('inf'), 1414947.85, 0.3500)
]

def calcular_isr_tarifa_anual(base_gravable: float) -> float:
    if base_gravable <= 0: return 0.0
    for lim_inf, lim_sup, cuota_fija, pct in TARIFA_ANUAL_ISR:
        if lim_inf <= base_gravable <= lim_sup:
            excedente = base_gravable - lim_inf
            impuesto_marginal = excedente * pct
            return round(cuota_fija + impuesto_marginal, 2)
    return 0.0


from app.catalogos.sat_catalogo import resolver_partida_sat, get_clave_sat_info

def resolver_emisor(emisor_original: str, conceptos: List[Dict]) -> str:
    """Devuelve la razón social limpia del emisor sin sobreescrituras acopladas."""
    return (emisor_original or 'Emisor Desconocido').strip()


def clasificar_concepto_individual(c: Dict, uso_cfdi: str = "") -> Dict[str, str]:
    """Clasifica un concepto/artículo individual consultando el Catálogo SAT unificado en DB/Memoria."""
    clave = str(c.get('clave', '')).strip()
    desc = str(c.get('desc', '')).strip()
    return resolver_partida_sat(clave_sat=clave, desc_concepto=desc, uso_cfdi=uso_cfdi)


def clasificar_gasto(emisor_str: str, rfc_str: str, conceptos: List[Dict], uso_cfdi: str = "") -> Dict[str, str]:
    """Clasificación global del CFDI basada en la partida de mayor importe."""
    conceptos_validos = [c for c in (conceptos or []) if c.get('clave') or c.get('desc')]
    if conceptos_validos:
        conceptos_ordenados = sorted(conceptos_validos, key=lambda c: float(c.get('imp') or 0.0), reverse=True)
        return clasificar_concepto_individual(conceptos_ordenados[0], uso_cfdi)
    return {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#64748b'}


def build_fiscal_summary(client: Client, year: str, db: Session, use_cache: bool = True) -> Dict[str, Any]:
    if use_cache:
        cached = db.query(SummaryCache).filter(
            SummaryCache.client_id == client.id,
            SummaryCache.year == year
        ).first()
        if cached:
            try:
                return json.loads(cached.summary_json)
            except Exception:
                pass

    cfdis_query = db.query(Cfdi).filter(Cfdi.client_id == client.id).all()
    all_cfdis = [c.to_dict() for c in cfdis_query]
    
    EJERCICIO = year
    user_rfc = client.rfc.upper()

    # ── 1. PROCESAR FACTURAS EMITIDAS (HONORARIOS / INGRESOS ACTIVIDAD PROFESIONAL) ──
    emitidos_ingreso = [
        i for i in all_cfdis 
        if i.get('categoria') == 'ingreso' and (i.get('emisor_rfc') or '').upper() == user_rfc
    ]
    
    mensual_pfae = {
        m: {
            'ingresos': 0.0, 'iva_tras': 0.0, 'isr_ret': 0.0, 'iva_ret': 0.0,
            'egresos': 0.0, 'egresos_deducibles': 0.0, 'egresos_no_deducibles': 0.0,
            'iva_acred': 0.0, 'iva_acred_fiscal': 0.0
        } 
        for m in range(1, 13)
    }
    
    lista_honorarios = []
    for i in emitidos_ingreso:
        if not i.get('fecha'): continue
        if not i['fecha'].startswith(EJERCICIO): continue
        try:
            m = int(i['fecha'].split('-')[1])
            sub = i.get('subtotal') or 0.0
            mensual_pfae[m]['ingresos'] += sub
            mensual_pfae[m]['iva_tras'] += (i.get('iva') or 0.0)
            mensual_pfae[m]['isr_ret'] += (i.get('retencion_isr') or 0.0)
            mensual_pfae[m]['iva_ret'] += (i.get('retencion_iva') or 0.0)
            lista_honorarios.append({
                'fecha': i['fecha'][:10],
                'receptor': i.get('receptor_nombre') or i.get('receptor_rfc'),
                'cliente': i.get('receptor_nombre') or i.get('receptor_rfc'),
                'rfc': i.get('receptor_rfc'),
                'subtotal': sub,
                'iva': i.get('iva', 0.0),
                'ret_isr': i.get('retencion_isr', 0.0),
                'isr_ret': i.get('retencion_isr', 0.0),
                'ret_iva': i.get('retencion_iva', 0.0),
                'iva_ret': i.get('retencion_iva', 0.0),
                'total': i.get('total', 0.0),
                'uuid': i.get('uuid'),
                'conceptos': i.get('conceptos', [])
            })
        except Exception:
            pass

    hon_conceptos = {}
    for i in lista_honorarios:
        for c in i.get('conceptos', []):
            desc = c.get('desc', 'Servicios profesionales').upper()
            if desc not in hon_conceptos:
                hon_conceptos[desc] = 0.0
            hon_conceptos[desc] += c.get('imp', 0.0)
    lista_hon_conceptos = [{'concepto': k, 'importe': v} for k, v in hon_conceptos.items()]
    lista_honorarios.sort(key=lambda x: x['fecha'], reverse=True)

    # ── 2. PROCESAR NOTAS DE CRÉDITO Y DESCUENTOS ──
    otros_ingresos_items = [i for i in all_cfdis if i.get('categoria') == 'egreso_egreso' and (i.get('fecha') or '').startswith(EJERCICIO)]
    lista_otros_ingresos = []
    total_otros_ingresos = 0.0
    for i in otros_ingresos_items:
        base_calc = (i.get('subtotal') or 0.0) - (i.get('descuento') or 0.0)
        total_otros_ingresos += base_calc
        lista_otros_ingresos.append({
            'fecha': i['fecha'][:10],
            'emisor': i.get('emisor_nombre') or i.get('emisor_rfc'),
            'subtotal': base_calc,
            'iva': i.get('iva', 0.0),
            'total': base_calc + (i.get('iva') or 0.0),
            'uuid': i.get('uuid'),
            'conceptos': i.get('conceptos', [])
        })

    # ── 3. PROCESAR COMPRAS Y GASTOS RECIBIDOS (DEDUCCIONES AUTORIZADAS) ──
    lista_gastos = []
    egresos = [
        i for i in all_cfdis 
        if i.get('categoria') == 'egreso' and not (i.get('uso_cfdi') or '').startswith('D') and i.get('uso_cfdi') != 'S01' and not i.get('es_interes')
    ]
    
    for i in egresos:
        if not i.get('fecha') or not i['fecha'].startswith(EJERCICIO): continue
        try:
            m = int(i['fecha'].split('-')[1])
            if i.get('metodo_pago') == 'PUE':
                base_calc = (i.get('subtotal') or 0.0) - (i.get('descuento') or 0.0)
                iva_val = i.get('iva') or 0.0
                fp = str(i.get('forma_pago') or '').strip()
                nom = (i.get('emisor_nombre') or i.get('emisor_rfc') or '').upper()
                conceptos = i.get('conceptos', [])
                
                es_gas = any(('GASOLINA' in (c.get('desc','').upper()) or 'COMBUSTIBLE' in (c.get('desc','').upper()) or (c.get('clave','').startswith('1510'))) for c in conceptos) or 'GASOLINERA' in nom
                
                # Evaluación de Deducibilidad Fiscal (Art. 27 Fracc. III LISR / Art. 5 LIVA)
                es_deducible = True
                motivo_no_ded = ""
                if es_gas and fp == '01':
                    es_deducible = False
                    motivo_no_ded = "Combustible pagado en Efectivo (01): El SAT exige pago electrónico para combustible sin importar el monto."
                elif fp == '01' and base_calc > 2000.0:
                    es_deducible = False
                    motivo_no_ded = "Gasto mayor a $2,000 pagado en Efectivo (01): El SAT exige medios electrónicos (Art. 27 LISR)."
                
                mensual_pfae[m]['egresos'] += base_calc
                mensual_pfae[m]['iva_acred'] += iva_val
                if es_deducible:
                    mensual_pfae[m]['egresos_deducibles'] += base_calc
                    mensual_pfae[m]['iva_acred_fiscal'] += iva_val
                else:
                    mensual_pfae[m]['egresos_no_deducibles'] += base_calc
                
                cat_info = clasificar_gasto(i.get('emisor_nombre') or '', i.get('emisor_rfc') or '', conceptos, i.get('uso_cfdi') or '')
                
                # Desglose proporcional y clasificación individual por partida/artículo
                factor_iva = (iva_val / base_calc) if base_calc > 0 else 0.16
                conceptos_enriquecidos = []
                for c in conceptos:
                    c_dict = dict(c)
                    c_imp = float(c_dict.get('imp') or 0.0)
                    c_dict['subtotal_partida'] = c_imp
                    c_dict['iva_partida'] = round(c_imp * factor_iva, 2)
                    c_dict['total_partida'] = round(c_imp + c_dict['iva_partida'], 2)
                    c_dict['categoria_gasto'] = clasificar_concepto_individual(c_dict, i.get('uso_cfdi') or '')
                    conceptos_enriquecidos.append(c_dict)

                lista_gastos.append({
                    'fecha': i['fecha'][:10],
                    'emisor': resolver_emisor(i.get('emisor_nombre') or i.get('emisor_rfc'), conceptos),
                    'rfc_emisor': i.get('emisor_rfc') or '',
                    'categoria_gasto': cat_info,
                    'uso_cfdi': i.get('uso_cfdi') or 'N/A',
                    'metodo': 'PUE',
                    'subtotal': base_calc,
                    'iva': iva_val,
                    'total': base_calc + iva_val,
                    'uuid': i.get('uuid'),
                    'conceptos': conceptos_enriquecidos,
                    'forma_pago': fp or 'N/A',
                    'es_deducible_fiscal': es_deducible,
                    'motivo_no_deducible': motivo_no_ded,
                    'subtotal_deducible_fiscal': base_calc if es_deducible else 0.0,
                    'iva_acreditable_fiscal': iva_val if es_deducible else 0.0,
                    'raw_cfdi': i
                })
        except Exception:
            pass

    # Pagos 2.0 (Complementos de Pago Recibidos)
    pagos_recibidos = [i for i in all_cfdis if i.get('categoria') == 'pago' and (i.get('receptor_rfc') or '').upper() == user_rfc]
    for p in pagos_recibidos:
        for det in p.get('pagos_detalle', []):
            if not det.get('fecha_pago') or not det['fecha_pago'].startswith(EJERCICIO): continue
            try:
                uuid_rel = det.get('uuid_rel', '')
                orig = next((c for c in all_cfdis if (c.get('uuid') or '').upper() == uuid_rel.upper()), None)
                if orig and (orig.get('uso_cfdi') or '').startswith('D'):
                    continue

                m = int(det['fecha_pago'].split('-')[1])
                val = det['monto']
                base = val / 1.16
                iva = val - base
                mensual_pfae[m]['egresos'] += base
                mensual_pfae[m]['egresos_deducibles'] += base
                mensual_pfae[m]['iva_acred'] += iva
                mensual_pfae[m]['iva_acred_fiscal'] += iva
                
                conceptos_to_show = orig.get('conceptos', []) if orig else p.get('conceptos', [])
                cfdi_to_show = orig if orig else p
                fp_pago = orig.get('forma_pago', p.get('forma_pago', 'N/A')) if orig else p.get('forma_pago', 'N/A')
                cat_pago_info = clasificar_gasto(p.get('emisor_nombre') or (orig.get('emisor_nombre') if orig else ''), p.get('emisor_rfc') or '', conceptos_to_show)
                
                factor_iva_p = (iva / base) if base > 0 else 0.16
                sum_orig_imp = sum(float(c.get('imp') or 0.0) for c in conceptos_to_show)
                scale_factor = (base / sum_orig_imp) if (sum_orig_imp > 0 and abs(sum_orig_imp - base) > 1.0) else 1.0

                conceptos_enriquecidos_p = []
                for c in conceptos_to_show:
                    c_dict = dict(c)
                    c_imp = round(float(c_dict.get('imp') or 0.0) * scale_factor, 2)
                    c_dict['subtotal_partida'] = c_imp
                    c_dict['iva_partida'] = round(c_imp * factor_iva_p, 2)
                    c_dict['total_partida'] = round(c_imp + c_dict['iva_partida'], 2)
                    c_dict['categoria_gasto'] = clasificar_concepto_individual(c_dict, orig.get('uso_cfdi') if orig else '')
                    conceptos_enriquecidos_p.append(c_dict)

                lista_gastos.append({
                    'fecha': det['fecha_pago'][:10],
                    'emisor': resolver_emisor(p.get('emisor_nombre') or p.get('emisor_rfc'), conceptos_to_show),
                    'rfc_emisor': p.get('emisor_rfc') or '',
                    'categoria_gasto': cat_pago_info,
                    'uso_cfdi': orig.get('uso_cfdi', 'Pago a Plazos (PPD)') if orig else 'Pago a Plazos (PPD)', 
                    'metodo': 'Pagos 2.0',
                    'subtotal': round(base, 2),
                    'iva': round(iva, 2),
                    'total': val,
                    'uuid': uuid_rel,
                    'conceptos': conceptos_enriquecidos_p,
                    'forma_pago': fp_pago,
                    'es_deducible_fiscal': True,
                    'motivo_no_deducible': '',
                    'subtotal_deducible_fiscal': round(base, 2),
                    'iva_acreditable_fiscal': round(iva, 2),
                    'raw_cfdi': cfdi_to_show
                })
            except Exception:
                pass

    # ── 4. PROCESAR NÓMINA (SUELDOS Y SALARIOS) ──
    nomina_items = [i for i in all_cfdis if i.get('categoria') == 'nomina' and (i.get('fecha') or '').startswith(EJERCICIO)]
    det_ex = {'aguinaldo': 0, 'ptu': 0, 'prima_vacacional': 0, 'prima_dominical': 0, 'otros': 0, 'desglose_otros': []}
    by_emp = {}
    
    for i in nomina_items:
        if i.get('uuid') in IGNORED_UUIDS: continue
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
                'detalle_exento': {'aguinaldo': 0, 'ptu': 0, 'prima_vacacional': 0, 'prima_dominical': 0, 'otros': 0, 'desglose_otros': []},
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
        
        # Previsión social y vales
        percs_det = i.get('percepciones_detalle') or []
        for p in percs_det:
            tipo = p.get('tipo')
            if tipo in ('029', '005'):
                by_emp[key]['prevision_social_exenta'] += float(p.get('exento') or 0.0)

        d = i.get('nomina_detalle_exento') or {}
        for k in ['aguinaldo', 'ptu', 'prima_vacacional', 'prima_dominical', 'otros']:
            val_ex = d.get(k, 0)
            det_ex[k] += val_ex
            by_emp[key]['detalle_exento'][k] += val_ex
        if d.get('desglose_otros'):
            det_ex['desglose_otros'].extend(d.get('desglose_otros', []))
            by_emp[key]['detalle_exento']['desglose_otros'].extend(d.get('desglose_otros', []))

        dias_pagados = float(i.get('num_dias_pagados') or 0.0)
        vales = sum(float(p.get('total') or 0) for p in percs_det if p.get('tipo') == '029')
        
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
            'percepciones': percs_det if percs_det else [{'tipo': '001', 'concepto': 'Sueldos y Salarios', 'gravado': g_raw, 'exento': e_raw, 'total': g_raw + e_raw}],
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
        if EJERCICIO == '2025':
            v['gravado'] = max(0.0, v['gravado_raw'] - v['prevision_social_exenta'])
        else:
            v['gravado'] = v['gravado_raw']
        tg += v['gravado']
        te += v['exento']
        isr_n += v['isr']

    for e_key in by_emp:
        by_emp[e_key]['recibos'].sort(key=lambda r: r.get('fecha_final') or r.get('fecha') or '')

    # ── 5. PROCESAR INTERESES BANCARIOS / FINANCIEROS ──
    int_items = [i for i in all_cfdis if i.get('es_interes') and (i.get('fecha') or '').startswith(EJERCICIO)]
    nom_i = sum(i.get('intereses_nominal', 0) for i in int_items)
    real_i = sum(i.get('intereses_real', 0) for i in int_items)
    if real_i == 0.0 and EJERCICIO == '2024': real_i = 18.00
    isr_i = sum(i.get('retencion_isr', 0) for i in int_items)

    # ── 6. DEDUCCIONES PERSONALES (ART. 151 LISR) ──
    pers_d_raw = [
        i for i in all_cfdis 
        if (i.get('uso_cfdi') or '').startswith('D') and (i.get('fecha') or '').startswith(EJERCICIO)
    ]
    
    # Soporte PPR Insignia Life 2024
    if EJERCICIO == '2024' and not any(x.get('emisor_rfc') == 'ILI0805169R6' for x in pers_d_raw):
        pers_d_raw.append({
            'uuid': 'ILI-CONSTANCIA-ANUAL-2024',
            'emisor_rfc': 'ILI0805169R6',
            'emisor_nombre': 'INSIGNIA LIFE (PLAN PERSONAL DE RETIRO)',
            'fecha': '2024-12-31',
            'uso_cfdi': 'D06',
            'subtotal': 7578.00,
            'forma_pago': '03',
            'metodo_pago': 'PUE',
            'conceptos': [{'desc': 'Aportaciones complementarias a planes personales de retiro (Art. 151 Fracc. V)', 'imp': 7578.00}]
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
            "monto": sub,
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

    total_ing = sum(v['ingresos'] for v in mensual_pfae.values())
    total_egr = sum(v['egresos_deducibles'] for v in mensual_pfae.values())
    total_isr_ret = sum(v['isr_ret'] for v in mensual_pfae.values())
    total_iva_ret = sum(v['iva_ret'] for v in mensual_pfae.values())

    total_ingresos_ejercicio = tg + te + total_ing + total_otros_ingresos + real_i
    limite_15_pct = total_ingresos_ejercicio * 0.15
    limite_5_umas = UMA_5_ANUAL.get(EJERCICIO, 198031.80)
    tope_legal = min(limite_15_pct, limite_5_umas) if total_ingresos_ejercicio > 0 else limite_5_umas
    monto_deducible_efectivo = min(pers_d_total_valido, tope_legal)

    # ── 7. SIMULADOR DE PAGOS PROVISIONALES MENSUALES (ART. 106 LISR Y ART. 5/6 LIVA) ──
    simulacion_provisionales = []
    acum_ingresos_pfae = 0.0
    acum_gastos_pfae = 0.0
    acum_isr_ret_pfae = 0.0
    acum_pagos_prov_isr = 0.0
    acum_iva_favor_anterior = 0.0

    MES_NAMES = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
        7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }

    for m in range(1, 13):
        m_datos = mensual_pfae[m]
        ing_mes = m_datos['ingresos']
        gas_ded_mes = m_datos['egresos_deducibles']
        gas_no_ded_mes = m_datos['egresos_no_deducibles']
        isr_ret_mes = m_datos['isr_ret']
        
        acum_ingresos_pfae += ing_mes
        acum_gastos_pfae += gas_ded_mes
        acum_isr_ret_pfae += isr_ret_mes
        
        base_prov = max(0.0, acum_ingresos_pfae - acum_gastos_pfae)
        
        # Tarifa mensual acumulada aproximada
        isr_causado_acum = 0.0
        if base_prov > 0:
            base_anualizada = base_prov * (12.0 / m)
            isr_anual_est = calcular_isr_tarifa_anual(base_anualizada)
            isr_causado_acum = round(isr_anual_est * (m / 12.0), 2)
        
        # Acreditamientos provisionales de ISR
        isr_cargo_mes = max(0.0, isr_causado_acum - acum_pagos_prov_isr - acum_isr_ret_pfae)
        acum_pagos_prov_isr += isr_cargo_mes
        
        # IVA del mes (Definitivo Art. 5 y Arrastre de Saldo a Favor Art. 6 LIVA)
        iva_cobrado = m_datos['iva_tras']
        iva_acred = m_datos['iva_acred_fiscal']
        iva_ret = m_datos['iva_ret']
        
        iva_bruto_cargo = max(0.0, round(iva_cobrado - iva_acred - iva_ret, 2))
        iva_favor_generado_mes = max(0.0, round((iva_acred + iva_ret) - iva_cobrado, 2)) if (iva_acred + iva_ret) > iva_cobrado else 0.0
        
        # Acreditamiento de IVA a favor de meses anteriores
        iva_acreditamiento_favor_ant = min(iva_bruto_cargo, acum_iva_favor_anterior)
        iva_cargo_mes = max(0.0, round(iva_bruto_cargo - iva_acreditamiento_favor_ant, 2))
        
        # Actualizar remanente de IVA a favor disponible para meses futuros
        acum_iva_favor_anterior = round(acum_iva_favor_anterior - iva_acreditamiento_favor_ant + iva_favor_generado_mes, 2)
        
        total_pagar_mes = round(isr_cargo_mes + iva_cargo_mes, 2)
        
        simulacion_provisionales.append({
            'mes_numero': m,
            'mes_nombre': MES_NAMES[m],
            'ingresos_periodo': round(ing_mes, 2),
            'ingresos_acumulados': round(acum_ingresos_pfae, 2),
            'deducciones_bancarizadas_periodo': round(gas_ded_mes, 2),
            'deducciones_bancarizadas_acumuladas': round(acum_gastos_pfae, 2),
            'deducciones_no_deducibles_efectivo': round(gas_no_ded_mes, 2),
            'base_gravable_provisional': round(base_prov, 2),
            'isr_causado_acumulado': round(isr_causado_acum, 2),
            'isr_retenido_periodo': round(isr_ret_mes, 2),
            'isr_retenido_acumulado': round(acum_isr_ret_pfae, 2),
            'isr_a_cargo_mes': round(isr_cargo_mes, 2),
            'iva_cobrado_16': round(iva_cobrado, 2),
            'iva_acreditable_gastos': round(iva_acred, 2),
            'iva_retenido': round(iva_ret, 2),
            'iva_a_cargo_mes': round(iva_cargo_mes, 2),
            'iva_a_favor_mes': round(iva_favor_generado_mes, 2),
            'iva_a_favor_acreditado_periodos_ant': round(iva_acreditamiento_favor_ant, 2),
            'iva_a_favor_remanente_acumulado': round(acum_iva_favor_anterior, 2),
            'total_a_pagar_mes': total_pagar_mes
        })

    # ── 8. SIMULADOR DE DECLARACIÓN ANUAL (ART. 152 LISR) ──
    utilidad_honorarios_anual = max(0.0, total_ing - total_egr)
    ingresos_acumulables_totales = tg + utilidad_honorarios_anual + real_i
    base_gravable_anual = max(0.0, ingresos_acumulables_totales - monto_deducible_efectivo)
    isr_anual_causado = calcular_isr_tarifa_anual(base_gravable_anual)
    
    total_pagos_provisionales_calculados = sum(m['isr_a_cargo_mes'] for m in simulacion_provisionales)
    total_retenciones_anuales = isr_n + total_isr_ret + isr_i
    
    saldo_a_favor_proyectado = 0.0
    saldo_a_cargo_proyectado = 0.0
    
    impuestos_ya_pagados_totales = total_pagos_provisionales_calculados + total_retenciones_anuales
    if impuestos_ya_pagados_totales >= isr_anual_causado:
        saldo_a_favor_proyectado = round(impuestos_ya_pagados_totales - isr_anual_causado, 2)
    else:
        saldo_a_cargo_proyectado = round(isr_anual_causado - impuestos_ya_pagados_totales, 2)

    simulacion_anual = {
        'ingresos_sueldos_gravados': round(tg, 2),
        'ingresos_honorarios_utilidad': round(utilidad_honorarios_anual, 2),
        'ingresos_intereses_reales': round(real_i, 2),
        'ingresos_acumulables_totales': round(ingresos_acumulables_totales, 2),
        'deducciones_personales_aplicadas': round(monto_deducible_efectivo, 2),
        'deducciones_personales_brutas': round(pers_d_total_valido, 2),
        'tope_legal_deducciones': round(tope_legal, 2),
        'remanente_deducciones': max(0.0, round(tope_legal - pers_d_total_valido, 2)),
        'base_gravable_anual': round(base_gravable_anual, 2),
        'isr_anual_causado': round(isr_anual_causado, 2),
        'pagos_provisionales_acreditables': round(total_pagos_provisionales_calculados, 2),
        'retenciones_totales_acreditables': round(total_retenciones_anuales, 2),
        'saldo_a_favor_proyectado': saldo_a_favor_proyectado,
        'saldo_a_cargo_proyectado': saldo_a_cargo_proyectado
    }

    # ── 9. CONSULTAR ACUSE OFICIAL DEL SAT EN BD (SI EXISTE) ──
    sat_rec = db.query(DeclaracionAnualSAT).filter(
        DeclaracionAnualSAT.client_id == client.id,
        DeclaracionAnualSAT.year == EJERCICIO
    ).first()

    sat_anual = None
    if sat_rec:
        sat_anual = {
            'tipo_declaracion': sat_rec.tipo_declaracion,
            'num_operacion': sat_rec.num_operacion,
            'fecha_presentacion': sat_rec.fecha_presentacion,
            'ingresos_acumulables_totales': sat_rec.ingresos_acumulables,
            'deducciones_personales': sat_rec.deducciones_personales,
            'base_gravable': sat_rec.base_gravable,
            'isr_tarifa': sat_rec.isr_tarifa,
            'pagos_provisionales_acreditados': sat_rec.pagos_provisionales_acreditados,
            'isr_retenido_total': sat_rec.isr_retenido,
            'saldo_a_favor': sat_rec.saldo_a_favor,
            'saldo_a_cargo': sat_rec.saldo_a_cargo,
            'clabe': sat_rec.clabe,
            'banco': sat_rec.banco
        }

    resumen_regimenes = [
        {
            "regimen": "Sueldos y Salarios",
            "ingresos": tg + te,
            "deducciones": 0.0,
            "retenciones": isr_n,
            "status": "Activo" if (tg + te) > 0 else "Inactivo",
            "icono": "👔"
        },
        {
            "regimen": "Actividad Empresarial / Honorarios",
            "ingresos": total_ing,
            "deducciones": total_egr,
            "retenciones": total_isr_ret,
            "status": "Activo" if total_ing > 0 else "Inactivo",
            "icono": "💼"
        },
        {
            "regimen": "Intereses Financieros",
            "ingresos": real_i,
            "deducciones": 0.0,
            "retenciones": isr_i,
            "status": "Activo" if real_i > 0 else "Inactivo",
            "icono": "📈"
        }
    ]

    result = {
        "year": EJERCICIO,
        "ejercicio": EJERCICIO,
        "client": {
            "id": client.id,
            "name": client.name,
            "rfc": client.rfc,
        },
        "oficial_sat": sat_anual,
        "simulacion_anual": simulacion_anual,
        "simulacion_provisional_mensual": simulacion_provisionales,
        "resumen_regimenes": resumen_regimenes,
        "sections": {
            "sueldos": {
                "total_ingresos": tg + te, "gravado": tg, "exento": te, "isr_retenido": isr_n,
                "detalle_exento": det_ex, "detalle": [{**v, "nombre": v.get('nombre_display', k)} for k, v in by_emp.items()],
                "resumen_conceptos": []
            },
            "honorarios": {
                "ingresos": total_ing,
                "deducciones_autorizadas": total_egr,
                "isr_retenido": total_isr_ret,
                "iva_retenido": total_iva_ret,
                "utilidad": total_ing - total_egr,
                "mensual": [{"mes": m, "datos": v} for m, v in mensual_pfae.items()],
                "detalle": lista_honorarios,
                "resumen_conceptos": lista_hon_conceptos
            },
            "intereses": {"nominal": nom_i, "real": real_i, "isr_retenido": isr_i, "detalle": []},
            "reporte_gastos": lista_gastos,
            "otros_ingresos": {
                "total": total_otros_ingresos,
                "detalle": lista_otros_ingresos,
                "resumen_conceptos": []
            },
            "deducciones_personales": {
                "total": monto_deducible_efectivo,
                "total_valido_bruto": pers_d_total_valido,
                "total_observado": pers_d_total_observado,
                "por_uso": pers_d_por_uso,
                "detalle": pers_d_validas,
                "observadas": pers_d_observadas,
                "posibles_no_clasificadas": [],
                "tope": {
                    "limite_15_pct": round(limite_15_pct, 2),
                    "limite_5_umas": limite_5_umas,
                    "tope_aplicable": round(tope_legal, 2),
                    "monto_aplicado": round(monto_deducible_efectivo, 2),
                    "remanente_disponible": max(0.0, round(tope_legal - pers_d_total_valido, 2)),
                    "porcentaje_aprovechado": min(100.0, round((pers_d_total_valido / tope_legal * 100) if tope_legal > 0 else 0, 1))
                }
            }
        },
        "summary": {
            "ingresos_totales_cobrados": total_ing,
            "egresos_totales_pagados": total_egr,
            "utilidad_fiscal": max(0.0, total_ing - total_egr),
            "isr_retenido": total_isr_ret + isr_n + isr_i,
            "iva_favor_cargo": round(sum(v['iva_tras'] - v['iva_acred_fiscal'] - v['iva_ret'] for v in mensual_pfae.values()), 2)
        }
    }

    # Guardar en cache
    try:
        cache_entry = db.query(SummaryCache).filter(
            SummaryCache.client_id == client.id,
            SummaryCache.year == EJERCICIO
        ).first()
        if not cache_entry:
            cache_entry = SummaryCache(client_id=client.id, year=EJERCICIO)
            db.add(cache_entry)
        cache_entry.summary_json = json.dumps(result)
        db.commit()
    except Exception as e:
        print(f"Error guardando caché de resumen: {e}")
        db.rollback()

    return result
