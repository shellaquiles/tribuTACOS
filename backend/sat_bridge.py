
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from parser import process_directory, USER_RFC

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

EMITIDOS_DIR = "/home/kubrick/www/declara/cfdi_emitidos"
RECIBIDOS_DIR = "/home/kubrick/www/declara/cfdi_recibidos"

@app.get("/api/download_xml")
def download_xml(filename: str):
    for directory in [EMITIDOS_DIR, RECIBIDOS_DIR]:
        for root, _, files in os.walk(directory):
            if filename in files:
                file_path = os.path.join(root, filename)
                return FileResponse(file_path, media_type='application/xml', filename=filename)
    
    raise HTTPException(status_code=404, detail="Archivo XML no original encontrado")

@app.get("/api/summary")
def get_summary(year: str = "2025"):
    all_cfdis = process_directory(EMITIDOS_DIR) + process_directory(RECIBIDOS_DIR)

    # --- IGNORED UUIDs (Cancelled directly in SAT portal) ---
    IGNORED_UUIDS = {
        '9CA1819A-BA40-4179-84A2-AFCBF5E885F3', # Cancelled MATTILDA payroll CFDI not marked as replaced
    }

    # --- YEAR FILTER ---
    EJERCICIO = year
    all_cfdis = [c for c in all_cfdis if (c.get('fecha') or '').startswith(EJERCICIO)
                 or c.get('categoria') == 'pago']

    # --- DEDUPLICAR por UUID ---
    seen_uuids = set()
    uniq = []
    for c in all_cfdis:
        uid = c.get('uuid') or id(c)
        if uid not in seen_uuids:
            seen_uuids.add(uid)
            uniq.append(c)
    all_cfdis = uniq

    # --- EXPERT PFAE ENGINE ---
    # Cash Basis (Cobrado / Pagado)
    mensual_pfae = {m: {'ingresos': 0.0, 'egresos': 0.0, 'isr_ret': 0.0, 'iva_ret': 0.0, 'iva_tras': 0.0, 'iva_acred': 0.0} for m in range(1, 13)}

    # Process EMITIDOS (Ingresos)
    hon_items = [i for i in all_cfdis if i['categoria'] == 'ingreso']
    lista_honorarios = []
    for i in hon_items:
        if not i['fecha']: continue
        try:
            m = int(i['fecha'].split('-')[1])
            base_calc = i['subtotal'] - i.get('descuento', 0)
            if i.get('metodo_pago') == 'PUE':
                mensual_pfae[m]['ingresos'] += base_calc
                mensual_pfae[m]['isr_ret'] += i['retencion_isr']
                mensual_pfae[m]['iva_ret'] += i['retencion_iva']
                mensual_pfae[m]['iva_tras'] += i['iva']
                
            lista_honorarios.append({
                'fecha': i['fecha'][:10],
                'cliente': i.get('receptor_nombre') or i.get('receptor_rfc'),
                'rfc': i.get('receptor_rfc'),
                'subtotal': base_calc,
                'iva': i['iva'],
                'isr_ret': i['retencion_isr'],
                'iva_ret': i['retencion_iva'],
                'total': base_calc + i['iva'] - i['retencion_isr'] - i['retencion_iva'],
                'uuid': i.get('uuid'),
                'metodo': i.get('metodo_pago') or 'N/A',
                'conceptos': i.get('conceptos', []),
                'raw_cfdi': i
            })
        except: pass

    # Agregar conceptos para Honorarios
    hon_conceptos = {}
    for i in lista_honorarios:
        for c in i.get('conceptos', []):
            desc = c.get('desc', 'Servicios profesionales').upper()
            if desc not in hon_conceptos:
                hon_conceptos[desc] = 0.0
            hon_conceptos[desc] += c.get('imp', 0.0)
    lista_hon_conceptos = [{'concepto': k, 'importe': v} for k, v in hon_conceptos.items()]

    lista_honorarios.sort(key=lambda x: x['fecha'], reverse=True)

    # Process Otros Ingresos (Credit Notes Received Tipo E where user is receptor)
    otros_ingresos_items = [i for i in all_cfdis if i['categoria'] == 'egreso_egreso']
    lista_otros_ingresos = []
    total_otros_ingresos = 0.0
    for i in otros_ingresos_items:
        if not i['fecha']: continue
        base_calc = i['subtotal'] - i.get('descuento', 0)
        total_otros_ingresos += base_calc
        lista_otros_ingresos.append({
            'fecha': i['fecha'][:10],
            'emisor': i.get('emisor_nombre') or i.get('emisor_rfc'),
            'subtotal': base_calc,
            'iva': i['iva'],
            'total': base_calc + i['iva'],
            'uuid': i.get('uuid'),
            'conceptos': i.get('conceptos', [])
        })
    lista_otros_ingresos.sort(key=lambda x: x['fecha'], reverse=True)


    # Data structure for the Detailed Expense Report
    lista_gastos = []

    def resolver_emisor(emisor_original, conceptos):
        texto = " ".join([str(c.get('desc', '')).lower() for c in conceptos])
        
        # Plataformas de Viaje / Entregas (Uber, Didi)
        kw_uber = ['cuota de solicitud', 'tarifa', 'ubereats', 'cuota de cancelación', 'mensajería en bicicleta', 'entrega de alimentos']
        if any(kw in texto for kw in kw_uber):
            return "UBER (Plataformas de Viaje y Entregas)"
        if "didi" in texto:
            return "DIDI (Plataformas de Viaje y Entregas)"
            
        # Supermercados e Hipermercados
        kw_super = ['kirkland', 'costco', 'walmart', 'soriana', 'chedraui', 'heb', 'bodega aurrera']
        if any(kw in texto for kw in kw_super) or any(kw in emisor_original.lower() for kw in kw_super):
            return "SUPERMERCADOS Y DESPENSA"

        # Gasolineras / Combustible
        kw_gas = ['magna', 'premium', 'g premium', 'g super', 'gpremium', 'gasolina', 'combustible']
        if any(kw in texto for kw in kw_gas) and not any(exc in texto for exc in ['bateria', 'kirkland', 'bouquet', 'spotify']):
            return "GASOLINERAS (Estaciones de Servicio)"
            
        return emisor_original

    # Process RECIBIDOS (Egresos)
    # Exclude UsoCFDI starting with D (Personal Deductions) or S01 (Sin efectos fiscales)
    egresos = [i for i in all_cfdis if i['categoria'] == 'egreso' and not (i.get('uso_cfdi') or '').startswith('D') and i.get('uso_cfdi') != 'S01' and not i.get('es_interes')]
    for i in egresos:
        if not i['fecha']: continue
        try:
            m = int(i['fecha'].split('-')[1])
            if i.get('metodo_pago') == 'PUE':
                base_calc = i['subtotal'] - i.get('descuento', 0)
                mensual_pfae[m]['egresos'] += base_calc
                mensual_pfae[m]['iva_acred'] += i['iva']
                lista_gastos.append({
                    'fecha': i['fecha'][:10],
                    'emisor': resolver_emisor(i['emisor_nombre'] or i['emisor_rfc'], i.get('conceptos', [])),
                    'uso_cfdi': i.get('uso_cfdi') or 'N/A',
                    'metodo': 'PUE',
                    'subtotal': base_calc,
                    'iva': i['iva'],
                    'total': base_calc + i['iva'],
                    'uuid': i.get('uuid'),
                    'conceptos': i.get('conceptos', []),
                    'forma_pago': i.get('forma_pago', 'N/A'),
                    'raw_cfdi': i
                })
        except: pass

    # Process PAGOS (Recibidos as deducciones pagadas)
    pagos_recibidos = [i for i in all_cfdis if i['categoria'] == 'pago' and i['receptor_rfc'] == USER_RFC]
    for p in pagos_recibidos:
        for det in p.get('pagos_detalle', []):
            if not det.get('fecha_pago'): continue
            if not det['fecha_pago'].startswith(EJERCICIO): continue  # Solo pagos año curso
            try:
                uuid_rel = det.get('uuid_rel', '')
                orig = next((c for c in all_cfdis if c.get('uuid', '').upper() == uuid_rel.upper()), None)
                if orig and (orig.get('uso_cfdi') or '').startswith('D'):
                    continue

                m = int(det['fecha_pago'].split('-')[1])
                val = det['monto']
                base = val / 1.16 # Assuming 16% IVA for simulation
                iva = val - base
                mensual_pfae[m]['egresos'] += base
                mensual_pfae[m]['iva_acred'] += iva
                
                conceptos_to_show = orig.get('conceptos', []) if orig else p.get('conceptos', [])
                cfdi_to_show = orig if orig else p
                
                lista_gastos.append({
                    'fecha': det['fecha_pago'][:10],
                    'emisor': resolver_emisor(p['emisor_nombre'] or p['emisor_rfc'], conceptos_to_show),
                    'uso_cfdi': orig.get('uso_cfdi', 'Pago a Plazos (PPD)') if orig else 'Pago a Plazos (PPD)', 
                    'metodo': 'Pagos 2.0',
                    'subtotal': round(base, 2),
                    'iva': round(iva, 2),
                    'total': val,
                    'uuid': uuid_rel,
                    'conceptos': conceptos_to_show,
                    'forma_pago': orig.get('forma_pago', p.get('forma_pago', 'N/A')) if orig else p.get('forma_pago', 'N/A'),
                    'raw_cfdi': cfdi_to_show
                })
            except: pass

    # --- SUELDOS (Stay as is) ---
    nomina_items = [i for i in all_cfdis if i['categoria'] == 'nomina']
    tg = sum(i.get('nomina_gravado', 0) for i in nomina_items if i.get('uuid') not in IGNORED_UUIDS)
    te = sum(i.get('nomina_exento', 0) for i in nomina_items if i.get('uuid') not in IGNORED_UUIDS)
    isr_n = sum(i['retencion_isr'] for i in nomina_items)
    det_ex = {'aguinaldo': 0, 'ptu': 0, 'prima_vacacional': 0, 'prima_dominical': 0, 'otros': 0, 'desglose_otros': []}
    by_emp = {}
    for i in nomina_items:
        key = i.get('emisor_rfc')
        if not key:
            key = i.get('emisor_nombre', 'Desconocido')
            
        if key not in by_emp:
            by_emp[key] = {
                'nombre_display': i.get('emisor_nombre') or key,
                'gravado': 0, 'exento': 0, 'isr': 0,
                'detalle_exento': {'aguinaldo': 0, 'ptu': 0, 'prima_vacacional': 0, 'prima_dominical': 0, 'otros': 0, 'desglose_otros': []},
                'recibos': []
            }
        else:
            # Update the display name if the new one is shorter (e.g. 4.0 drops "S.A.")
            current_name = by_emp[key]['nombre_display']
            new_name = i.get('emisor_nombre')
            if new_name and len(new_name) < len(current_name):
                by_emp[key]['nombre_display'] = new_name
        
        # Add income only if NOT ignored
        if i.get('uuid') not in IGNORED_UUIDS:
            by_emp[key]['gravado'] += i.get('nomina_gravado', 0)
            by_emp[key]['exento'] += i.get('nomina_exento', 0)
            d = i.get('nomina_detalle_exento', {})
            for k in ['aguinaldo', 'ptu', 'prima_vacacional', 'prima_dominical', 'otros']:
                det_ex[k] += d.get(k, 0)
                by_emp[key]['detalle_exento'][k] += d.get(k, 0)
            det_ex['desglose_otros'].extend(d.get('desglose_otros', []))
            by_emp[key]['detalle_exento']['desglose_otros'].extend(d.get('desglose_otros', []))
            
        # Add ISR always (SAT credits withheld taxes even on zeroed/substituted income)
        by_emp[key]['isr'] += i['retencion_isr']

        # Add the detailed receipt
        dias_pagados = i.get('num_dias_pagados')
        if isinstance(dias_pagados, str):
            try: dias_pagados = float(dias_pagados)
            except: dias_pagados = 0.0
        elif dias_pagados is None:
            dias_pagados = 0.0
            
        # Calculate Vouchers (Type 029) to subtract from Net Pay
        vales = sum(p.get('total', 0) for p in i.get('percepciones_detalle', []) if p.get('tipo') == '029')
            
        recibo = {
            'uuid': i.get('uuid'),
            'fecha': i.get('fecha_pago_nomina') or i.get('fecha', '')[:10],
            'fecha_inicial': i.get('fecha_inicial_pago'),
            'fecha_final': i.get('fecha_final_pago'),
            'dias_pagados': dias_pagados,
            'total_bruto': i.get('subtotal', 0),
            'total_deducciones': i.get('descuento', 0),
            'vales': vales,
            'neto': round(i.get('total', 0) - vales, 2),
            'isr_retenido': i.get('retencion_isr', 0),
            'percepciones': i.get('percepciones_detalle', []),
            'deducciones': i.get('deducciones_detalle', []),
            'raw_cfdi': i
        }
        by_emp[key]['recibos'].append(recibo)

    # Sort receipts chronologically for each employer
    for e_key in by_emp:
        by_emp[e_key]['recibos'].sort(key=lambda r: r['fecha_final'] or r['fecha'])

    # Aggregate concepts for Sueldos
    sueldos_conceptos = {}
    for i in nomina_items:
        if i.get('uuid') in IGNORED_UUIDS: continue
        for p in i.get('percepciones_detalle', []):
            cname = p.get('concepto', 'Otra Percepción').upper()
            if cname not in sueldos_conceptos:
                sueldos_conceptos[cname] = {'tipo': 'percepcion', 'gravado': 0, 'exento': 0, 'total': 0}
            sueldos_conceptos[cname]['gravado'] += p.get('gravado', 0)
            sueldos_conceptos[cname]['exento'] += p.get('exento', 0)
            sueldos_conceptos[cname]['total'] += p.get('total', 0)
        for d in i.get('deducciones_detalle', []):
            cname = d.get('concepto', 'Otra Deducción').upper()
            if cname not in sueldos_conceptos:
                sueldos_conceptos[cname] = {'tipo': 'deduccion', 'total': 0}
            sueldos_conceptos[cname]['total'] += d.get('importe', 0)
    
    lista_sueldos_conceptos = [{'concepto': k, **v} for k, v in sueldos_conceptos.items()]
    lista_sueldos_conceptos.sort(key=lambda x: x.get('total', 0), reverse=True)

    # --- INTERESES ---
    int_items = [i for i in all_cfdis if i.get('es_interes')]
    nom_i = sum(i.get('intereses_nominal', 0) for i in int_items)
    real_i = sum(i.get('intereses_real', 0) for i in int_items)
    isr_i = sum(i.get('retencion_isr', 0) for i in int_items)
    int_detalle = []
    for i in int_items:
        int_detalle.append({
            "uuid": i.get('uuid'),
            "emisor": i.get('emisor_nombre') or i.get('emisor_rfc'),
            "fecha": i.get('fecha', '').split('T')[0],
            "nominal": i.get('intereses_nominal', 0),
            "real": i.get('intereses_real', 0),
            "retencion_isr": i.get('retencion_isr', 0)
        })
    int_detalle.sort(key=lambda x: x['fecha'], reverse=True)

    # --- TOTALS ---
    total_ing = sum(v['ingresos'] for v in mensual_pfae.values())
    total_egr = sum(v['egresos'] for v in mensual_pfae.values())
    total_isr_ret = sum(v['isr_ret'] for v in mensual_pfae.values())
    total_iva_ret = sum(v['iva_ret'] for v in mensual_pfae.values())
    total_iva_tras = sum(v['iva_tras'] for v in mensual_pfae.values())
    total_iva_acred = sum(v['iva_acred'] for v in mensual_pfae.values())

    # --- PERSONAL DEDUCTIONS ---
    # SAT Rule: Deducciones Personales are strictly invalid if paid in Cash (01) or left 'Por Definir' (99) without a linked payment.
    # SAT Rule: Pharmacies (like PHARMA PLUS) are auto-blocked for D01 since medicines must be billed by a hospital.
    invalid_formas = ['01', '99']
    blocked_emisores = ['PHARMA PLUS']
    
    pers_d_items = [
        i for i in all_cfdis 
        if i['categoria'] == 'egreso' 
        and (i.get('uso_cfdi') or '').startswith('D')
        and i.get('forma_pago') not in invalid_formas
        and not any(b in (i.get('emisor_nombre') or '').upper() for b in blocked_emisores)
    ]
    pers_d_total = sum(i['subtotal'] for i in pers_d_items)
    pers_d_por_uso = {}
    pers_d_detalle = []
    
    for i in pers_d_items:
        uso = i.get('uso_cfdi')
        if uso not in pers_d_por_uso:
            pers_d_por_uso[uso] = 0.0
        pers_d_por_uso[uso] += i['subtotal']
        
        pers_d_detalle.append({
            "uuid": i.get('uuid'),
            "emisor": i.get('emisor_nombre') or i.get('emisor_rfc'),
            "fecha": i.get('fecha', '').split('T')[0],
            "uso_cfdi": uso,
            "monto": i.get('subtotal', 0)
        })
        
    pers_d_detalle.sort(key=lambda x: x['fecha'])

    # --- Otros Ingresos Concept Aggregation ---
    otros_conceptos = {}
    for i in lista_otros_ingresos:
        for c in i.get('conceptos', []):
            desc = c.get('desc', 'Descuento o Bonificación').upper()
            if desc not in otros_conceptos:
                otros_conceptos[desc] = 0.0
            otros_conceptos[desc] += c.get('imp', 0.0)
    lista_otros_conceptos = [{'concepto': k, 'importe': v} for k, v in otros_conceptos.items()]

    return {
        "sections": {
            "sueldos": {
                "total_ingresos": tg+te, "gravado": tg, "exento": te, "isr_retenido": isr_n,
                "detalle_exento": det_ex, "detalle": [{**v, "nombre": v.get('nombre_display', k)} for k, v in by_emp.items()],
                "resumen_conceptos": lista_sueldos_conceptos
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
            "intereses": {"nominal": nom_i, "real": real_i, "isr_retenido": isr_i, "detalle": int_detalle},
            "reporte_gastos": lista_gastos,
            "otros_ingresos": {
                "total": total_otros_ingresos,
                "detalle": lista_otros_ingresos,
                "resumen_conceptos": lista_otros_conceptos
            },
            "deducciones_personales": {
                "total": pers_d_total, 
                "por_uso": pers_d_por_uso,
                "detalle": pers_d_detalle
            }
        },
        "summary": {
            "ingresos_totales_cobrados": total_ing + total_otros_ingresos,
            "egresos_totales_pagados": total_egr,
            "utilidad_fiscal": max((total_ing + total_otros_ingresos) - total_egr, 0),
            "isr_retenido": total_isr_ret + isr_n + isr_i,
            "iva_favor_cargo": (total_iva_tras - total_iva_ret) - total_iva_acred
        }
    }

@app.get("/api/cfdis")
def get_cfdis():
    return {"emitidos": process_directory(EMITIDOS_DIR), "recibidos": process_directory(RECIBIDOS_DIR)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8010)
