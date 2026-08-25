"""
Calculadora de Gastos, Compras y Deducciones Autorizadas (LISR Art. 27 / LIVA Art. 5).
Evalúa deducibilidad fiscal (medios de pago, combustible, límites en efectivo),
enriquece conceptos con el Catálogo SAT y procesa complementos de Pago 2.0.
Pre-calcula matriz mensual, resumen de categorías SAT y concentración de proveedores.
"""

from typing import Dict, List, Any, Optional
from app.catalogos.sat_catalogo import resolver_partida_sat


def resolver_emisor(emisor_original: str, conceptos: List[Dict]) -> str:
    """Devuelve la razón social limpia del emisor."""
    return (emisor_original or 'Emisor Desconocido').strip()


def clasificar_concepto_individual(c: Dict, uso_cfdi: str = "") -> Dict[str, Any]:
    """Clasifica un concepto o partida individual consultando el Catálogo SAT unificado."""
    clave = str(c.get('clave', '')).strip()
    desc = str(c.get('desc', '')).strip()
    return resolver_partida_sat(clave_sat=clave, desc_concepto=desc, uso_cfdi=uso_cfdi)


def clasificar_gasto(
    emisor_str: str,
    rfc_str: str,
    conceptos: List[Dict],
    uso_cfdi: str = ""
) -> Dict[str, Any]:
    """Clasificación global del CFDI basada en la partida de mayor importe."""
    conceptos_validos = [c for c in (conceptos or []) if c.get('clave') or c.get('desc')]
    if conceptos_validos:
        conceptos_ordenados = sorted(conceptos_validos, key=lambda c: float(c.get('imp') or 0.0), reverse=True)
        return clasificar_concepto_individual(conceptos_ordenados[0], uso_cfdi)
    return {
        'id': 'otros_operativos',
        'nombre': 'Otros Gastos Operativos',
        'icono': '📋',
        'color': '#64748b'
    }


def calcular_gastos(
    all_cfdis: List[Dict[str, Any]],
    year: str,
    user_rfc: str,
    mensual_pfae: Dict[int, Dict[str, float]]
) -> Dict[str, Any]:
    """
    Procesa todos los egresos (PUE y Pagos 2.0) y actualiza el acumulador mensual_pfae:
    - Evaluación de deducibilidad Art. 27 LISR
    - Partidas individuales enriquecidas con taxonomía SAT
    - Acreditamiento fiscal de IVA
    - Pre-cálculo de matriz mensual y resumen por categorías para el frontend
    """
    lista_gastos = []
    user_rfc_upper = user_rfc.upper()

    # 1. Facturas de Egresos PUE
    egresos = [
        i for i in all_cfdis
        if i.get('categoria') == 'egreso'
        and not (i.get('uso_cfdi') or '').startswith('D')
        and i.get('uso_cfdi') != 'S01'
        and not i.get('es_interes')
    ]

    for i in egresos:
        fecha = i.get('fecha') or ''
        if not fecha.startswith(year):
            continue
        try:
            m = int(fecha.split('-')[1])
            if i.get('metodo_pago') == 'PUE':
                base_calc = float(i.get('subtotal') or 0.0) - float(i.get('descuento') or 0.0)
                iva_val = float(i.get('iva') or 0.0)
                fp = str(i.get('forma_pago') or '').strip()
                nom = (i.get('emisor_nombre') or i.get('emisor_rfc') or '').upper()
                conceptos = i.get('conceptos', [])

                es_gas = any(
                    ('GASOLINA' in (c.get('desc', '').upper()) or
                     'COMBUSTIBLE' in (c.get('desc', '').upper()) or
                     (c.get('clave', '').startswith('1510')))
                    for c in conceptos
                ) or 'GASOLINERA' in nom

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

                cat_info = clasificar_gasto(
                    i.get('emisor_nombre') or '',
                    i.get('emisor_rfc') or '',
                    conceptos,
                    i.get('uso_cfdi') or ''
                )

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
                    'fecha': fecha[:10],
                    'emisor': resolver_emisor(i.get('emisor_nombre') or i.get('emisor_rfc'), conceptos),
                    'rfc_emisor': i.get('emisor_rfc') or '',
                    'categoria_gasto': cat_info,
                    'uso_cfdi': i.get('uso_cfdi') or 'N/A',
                    'metodo': 'PUE',
                    'subtotal': round(base_calc, 2),
                    'iva': round(iva_val, 2),
                    'total': round(base_calc + iva_val, 2),
                    'uuid': i.get('uuid'),
                    'conceptos': conceptos_enriquecidos,
                    'forma_pago': fp or 'N/A',
                    'es_deducible_fiscal': es_deducible,
                    'motivo_no_deducible': motivo_no_ded,
                    'subtotal_deducible_fiscal': round(base_calc if es_deducible else 0.0, 2),
                    'iva_acreditable_fiscal': round(iva_val if es_deducible else 0.0, 2),
                    'raw_cfdi': i
                })
        except Exception:
            pass

    # 2. Pagos 2.0 (Complementos de Pago Recibidos)
    pagos_recibidos = [
        i for i in all_cfdis
        if i.get('categoria') == 'pago' and (i.get('receptor_rfc') or '').upper() == user_rfc_upper
    ]
    for p in pagos_recibidos:
        for det in p.get('pagos_detalle', []):
            fecha_pago = det.get('fecha_pago') or ''
            if not fecha_pago.startswith(year):
                continue
            try:
                uuid_rel = det.get('uuid_rel', '')
                orig = next((c for c in all_cfdis if (c.get('uuid') or '').upper() == uuid_rel.upper()), None)
                if orig and (orig.get('uso_cfdi') or '').startswith('D'):
                    continue

                m = int(fecha_pago.split('-')[1])
                val = float(det.get('monto') or 0.0)
                base = val / 1.16
                iva = val - base
                mensual_pfae[m]['egresos'] += base
                mensual_pfae[m]['egresos_deducibles'] += base
                mensual_pfae[m]['iva_acred'] += iva
                mensual_pfae[m]['iva_acred_fiscal'] += iva

                conceptos_to_show = orig.get('conceptos', []) if orig else p.get('conceptos', [])
                cfdi_to_show = orig if orig else p
                fp_pago = orig.get('forma_pago', p.get('forma_pago', 'N/A')) if orig else p.get('forma_pago', 'N/A')
                cat_pago_info = clasificar_gasto(
                    p.get('emisor_nombre') or (orig.get('emisor_nombre') if orig else ''),
                    p.get('emisor_rfc') or '',
                    conceptos_to_show
                )

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
                    'fecha': fecha_pago[:10],
                    'emisor': resolver_emisor(p.get('emisor_nombre') or p.get('emisor_rfc'), conceptos_to_show),
                    'rfc_emisor': p.get('emisor_rfc') or '',
                    'categoria_gasto': cat_pago_info,
                    'uso_cfdi': orig.get('uso_cfdi', 'Pago a Plazos (PPD)') if orig else 'Pago a Plazos (PPD)',
                    'metodo': 'Pagos 2.0',
                    'subtotal': round(base, 2),
                    'iva': round(iva, 2),
                    'total': round(val, 2),
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

    # ─── PRE-CÁLCULO DE RESUMEN POR CATEGORÍAS Y PROVEEDORES ───
    cat_summary_map: Dict[str, Dict[str, Any]] = {}
    proveedores_map: Dict[str, Dict[str, Any]] = {}

    for g in lista_gastos:
        c_info = g.get('categoria_gasto') or {'id': 'otros_operativos', 'nombre': 'Otros Gastos Operativos', 'icono': '📋', 'color': '#64748b'}
        c_id = c_info.get('id', 'otros_operativos')

        if c_id not in cat_summary_map:
            cat_summary_map[c_id] = {
                'id': c_id,
                'nombre': c_info.get('nombre', 'Otros Gastos'),
                'icono': c_info.get('icono', '📋'),
                'color': c_info.get('color', '#64748b'),
                'subtotal': 0.0,
                'iva': 0.0,
                'total': 0.0,
                'subtotal_deducible': 0.0,
                'comprobantes_count': 0
            }
        cat_summary_map[c_id]['subtotal'] += g.get('subtotal', 0.0)
        cat_summary_map[c_id]['iva'] += g.get('iva', 0.0)
        cat_summary_map[c_id]['total'] += g.get('total', 0.0)
        cat_summary_map[c_id]['subtotal_deducible'] += g.get('subtotal_deducible_fiscal', 0.0)
        cat_summary_map[c_id]['comprobantes_count'] += 1

        p_rfc = g.get('rfc_emisor') or 'XAXX010101000'
        p_nom = g.get('emisor') or p_rfc
        if p_rfc not in proveedores_map:
            proveedores_map[p_rfc] = {
                'rfc': p_rfc,
                'nombre': p_nom,
                'subtotal': 0.0,
                'iva': 0.0,
                'total': 0.0,
                'comprobantes_count': 0
            }
        proveedores_map[p_rfc]['subtotal'] += g.get('subtotal', 0.0)
        proveedores_map[p_rfc]['iva'] += g.get('iva', 0.0)
        proveedores_map[p_rfc]['total'] += g.get('total', 0.0)
        proveedores_map[p_rfc]['comprobantes_count'] += 1

    resumen_categorias = sorted(
        [
            {
                **v,
                'subtotal': round(v['subtotal'], 2),
                'iva': round(v['iva'], 2),
                'total': round(v['total'], 2),
                'subtotal_deducible': round(v['subtotal_deducible'], 2)
            }
            for v in cat_summary_map.values()
        ],
        key=lambda x: x['subtotal'],
        reverse=True
    )

    top_proveedores = sorted(
        [
            {
                **v,
                'subtotal': round(v['subtotal'], 2),
                'iva': round(v['iva'], 2),
                'total': round(v['total'], 2)
            }
            for v in proveedores_map.values()
        ],
        key=lambda x: x['subtotal'],
        reverse=True
    )

    m_labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    matriz_mensual = [
        {
            'name': m_labels[m - 1],
            'mes_num': m,
            'egresos_brutos': round(mensual_pfae[m]['egresos'], 2),
            'egresos_deducibles': round(mensual_pfae[m]['egresos_deducibles'], 2),
            'egresos_no_deducibles': round(mensual_pfae[m]['egresos_no_deducibles'], 2),
            'iva_acreditable_fiscal': round(mensual_pfae[m]['iva_acred_fiscal'], 2),
            'iva_acreditable_bruto': round(mensual_pfae[m]['iva_acred'], 2)
        }
        for m in range(1, 13)
    ]

    return {
        'lista_gastos': lista_gastos,
        'resumen_categorias': resumen_categorias,
        'top_proveedores': top_proveedores,
        'matriz_mensual': matriz_mensual,
        'total_egresos_deducibles': round(sum(v['egresos_deducibles'] for v in mensual_pfae.values()), 2),
        'total_egresos_brutos': round(sum(v['egresos'] for v in mensual_pfae.values()), 2),
        'total_iva_acreditable_fiscal': round(sum(v['iva_acred_fiscal'] for v in mensual_pfae.values()), 2)
    }
