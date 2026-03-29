import os
from lxml import etree
from datetime import datetime
try:
    from . import cat_sat
except ImportError:
    import cat_sat
from typing import List, Dict, Optional

NS = {
    'cfdi': 'http://www.sat.gob.mx/cfd/4',
    'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
    'nomina12': 'http://www.sat.gob.mx/nomina12'
}

USER_RFC = "GAQA810905BCA"

def parse_cfdi(xml_path: str) -> Optional[Dict]:
    try:
        tree = etree.parse(xml_path)
        root = tree.getroot()

        # Dynamic CFDI namespace to support both 3.3 and 4.0 files
        ns_cfdi = root.tag.split('}')[0].strip('{') if '}' in root.tag else 'http://www.sat.gob.mx/cfd/4'
        NS = {
            'cfdi': ns_cfdi,
            'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
            'nomina12': 'http://www.sat.gob.mx/nomina12'
        }

        # Basic attributes
        version = root.get('Version')
        fecha_str = root.get('Fecha')
        subtotal = float(root.get('SubTotal', 0))
        descuento = float(root.get('Descuento', 0))
        total = float(root.get('Total', 0))
        moneda = root.get('Moneda', 'MXN')
        tipo_comprobante = root.get('TipoDeComprobante')

        # Emisor and Receptor details
        emisor = root.find('cfdi:Emisor', NS)
        emisor_rfc = emisor.get('Rfc') if emisor is not None else None
        emisor_nombre = emisor.get('Nombre') if emisor is not None else None
        emisor_regimen = emisor.get('RegimenFiscal') if emisor is not None else None

        receptor = root.find('cfdi:Receptor', NS)
        receptor_rfc = receptor.get('Rfc') if receptor is not None else None
        receptor_nombre = receptor.get('Nombre') if receptor is not None else None
        uso_cfdi = receptor.get('UsoCFDI') if receptor is not None else None

        # Timbre Fiscal (UUID)
        complemento = root.find('cfdi:Complemento', NS)
        uuid = None
        if complemento is not None:
            tfd = complemento.find('tfd:TimbreFiscalDigital', NS)
            if tfd is not None:
                uuid = tfd.get('UUID')

        # Determine Category and Tipo
        metodo_pago = root.get('MetodoPago')
        forma_pago = root.get('FormaPago')
        category = "unknown"
        if tipo_comprobante == 'N':
            category = "nomina"
        elif tipo_comprobante == 'P':
            category = "pago"
        elif emisor_rfc == USER_RFC:
            category = "ingreso" if tipo_comprobante == 'I' else "egreso_ingreso" # E is credit note to client
        elif receptor_rfc == USER_RFC:
            category = "egreso" if tipo_comprobante == 'I' else "egreso_egreso" # E is discount from supplier

        # Taxes: Traslados and Retenciones
        impuestos_root = root.find('cfdi:Impuestos', NS)
        iva_trasladado = 0.0
        retencion_iva = 0.0
        retencion_isr = 0.0

        if impuestos_root is not None:
            # Handle standard Traslados
            traslados = impuestos_root.find('cfdi:Traslados', NS)
            if traslados is not None:
                for t in traslados.findall('cfdi:Traslado', NS):
                    if t.get('Impuesto') == '002': # IVA
                        iva_trasladado += float(t.get('Importe', 0))

            # Handle Retenciones
            retenciones = impuestos_root.find('cfdi:Retenciones', NS)
            if retenciones is not None:
                for r in retenciones.findall('cfdi:Retencion', NS):
                    imp = r.get('Impuesto')
                    val = float(r.get('Importe', 0))
                    if imp == '001': # ISR
                        retencion_isr += val
                    elif imp == '002': # IVA
                        retencion_iva += val

        # Special case: Payments (Complemento de Pago)
        total_pago = 0.0
        pagos_detalle = []
        if category == "pago" and complemento is not None:
            # We use the correct namespace for Pagos20 or Pagos10
            pagos = complemento.find('{http://www.sat.gob.mx/Pagos20}Pagos')
            if pagos is not None:
                totales = pagos.find('{http://www.sat.gob.mx/Pagos20}Totales')
                if totales is not None:
                    total_pago = float(totales.get('MontoTotalPagos', 0))

                for p in pagos.findall('{http://www.sat.gob.mx/Pagos20}Pago'):
                    monto = float(p.get('Monto', 0))
                    fecha_p = p.get('FechaPago')
                    for dr in p.findall('{http://www.sat.gob.mx/Pagos20}DoctoRelacionado'):
                        pagos_detalle.append({
                            'uuid_rel': dr.get('IdDocumento'),
                            'monto': float(dr.get('ImpPagado', 0)),
                            'parcialidad': dr.get('NumParcialidad'),
                            'fecha_pago': fecha_p
                        })

        # Special case: Payroll (Nómina) deductions as ISR retention
        if category == "nomina" and complemento is not None:
            # ISR is usually extracted from deducciones
            nomina12 = complemento.find('.//nomina12:Nomina', namespaces={'nomina12': 'http://www.sat.gob.mx/nomina12'})
            if nomina12 is not None:
                isr_detalle = 0.0
                total_deducciones = nomina12.find('.//nomina12:Deducciones', namespaces={'nomina12': 'http://www.sat.gob.mx/nomina12'})
                if total_deducciones is not None:
                    for d in total_deducciones.findall('.//nomina12:Deduccion', namespaces={'nomina12': 'http://www.sat.gob.mx/nomina12'}):
                        if d.get('TipoDeduccion') == '002': # ISR
                            isr_detalle += float(d.get('Importe', 0))
                
                if retencion_isr == 0 and isr_detalle > 0:
                    retencion_isr = isr_detalle

        # Special case: Intereses
        es_interes = False
        int_nom = 0.0
        int_real = 0.0
        
        # SAT Rule: Intereses as INCOME are usually issued via "Retenciones y Pagos" documents
        # or specific CFDI 4.0 'Comprobante' with 'TipoDeComprobante=I' but where the 
        # bank is the emisor and the context is clear (e.g. investment yields).
        # However, for PFAE, interest PAID to a bank (e.g. mortgage, credit card fees) 
        # is an EGRESO/DEDUCTION, not a taxable INCOME interest.
        
        retenciones_root = root.tag.endswith('Retenciones')
        if retenciones_root or 'Retenciones' in root.tag:
            category = "retencion"
            es_interes = True # Income interest (investment)
            comple = root.find('{http://www.sat.gob.mx/esquemas/retencionpago/1}Complemento')
            if comple is not None:
                int_node = comple.find('{http://www.sat.gob.mx/esquemas/retencionpago/1/intereses}Intereses')
                if int_node is not None:
                    int_nom = float(int_node.get('MontIntNominal', 0))
                    int_real = float(int_node.get('MontIntReal', 0))

        # Prepare base data dictionary
        data = {
            'uuid': uuid,
            'fecha': fecha_str,
            'emisor_rfc': emisor_rfc,
            'emisor_nombre': emisor_nombre,
            'emisor_regimen': emisor_regimen,
            'receptor_rfc': receptor_rfc,
            'receptor_nombre': receptor_nombre,
            'uso_cfdi': uso_cfdi,
            'metodo_pago': metodo_pago,
            'subtotal': subtotal,
            'descuento': descuento,
            'total': total,
            'iva': iva_trasladado,
            'retencion_iva': retencion_iva,
            'retencion_isr': retencion_isr,
            'nomina_gravado': 0.0,
            'nomina_exento': 0.0,
            'nomina_detalle_exento': {
                'aguinaldo': 0.0,
                'ptu': 0.0,
                'prima_vacacional': 0.0,
                'prima_dominical': 0.0,
                'otros': 0.0,
                'desglose_otros': [] # For Fondo de Ahorro, Vales, etc.
            },
            'intereses_nominal': int_nom,
            'intereses_gravado': 0.0,
            'intereses_real': int_real,
            'es_interes': es_interes,
            'conceptos': [],
            'pagos_detalle': pagos_detalle,
            'fecha_pago_nomina': None,
            'fecha_inicial_pago': None,
            'fecha_final_pago': None,
            'num_dias_pagados': None,
            'salario_diario_integrado': 0.0,
            'salario_base_cot_apor': 0.0,
            'percepciones_detalle': [],
            'deducciones_detalle': []
        }

        # Concept analysis for Interests and granular extraction
        conceptos_list = []
        conceptos_node = root.find('cfdi:Conceptos', NS)
        if conceptos_node is not None:
            for c in conceptos_node.findall('cfdi:Concepto', NS):
                desc = c.get('Descripcion', '') # Mantenemos case original
                imp = float(c.get('Importe', 0))
                clave = c.get('ClaveProdServ', '00000000')
                no_id = c.get('NoIdentificacion', desc)
                # Enriquecer con la descripción oficial del catálogo SAT
                desc_cat = cat_sat.describe(clave)
                # Si no hay match en el catálogo, usar la descripción del XML en Title Case
                if not desc_cat:
                    desc_cat = desc.title() if desc else 'Servicio profesional'
                conceptos_list.append({
                    'desc': desc.upper(),  # Badge interior (UPPER)
                    'imp': imp,
                    'clave': clave,
                    'desc_sat': desc_cat,  # Título visual (desde catálogo SAT o Title Case)
                    'no_id': no_id.title() if no_id == desc else no_id
                })
                if 'interé' in desc or 'intere' in desc:
                    # If it's a regular Comprobante (not a Retenciones file), we don't mark as es_interes (income)
                    # unless it's explicitly issued as a yield document.
                    # For now, we only populate interests_* if it's confirmed es_interes
                    if data['es_interes']:
                        data['intereses_nominal'] += imp
                        if 'exento' not in desc:
                            data['intereses_gravado'] += imp

        data['conceptos'] = conceptos_list

        # Special case: Payroll (Nómina) granular extraction
        if category == "nomina" and complemento is not None:
            nomina = complemento.find('nomina12:Nomina', NS)
            if nomina is not None:
                data['fecha_pago_nomina'] = nomina.get('FechaPago')
                data['fecha_inicial_pago'] = nomina.get('FechaInicialPago')
                data['fecha_final_pago'] = nomina.get('FechaFinalPago')
                
                # Intentar convertir dias pagados
                dias_raw = nomina.get('NumDiasPagados')
                try: data['num_dias_pagados'] = float(dias_raw) if dias_raw else 0.0
                except: data['num_dias_pagados'] = 0.0

                receptor = nomina.find('nomina12:Receptor', NS)
                if receptor is not None:
                    data['salario_diario_integrado'] = float(receptor.get('SalarioDiarioIntegrado', 0))
                    data['salario_base_cot_apor'] = float(receptor.get('SalarioBaseCotApor', 0))

                percepciones = nomina.find('nomina12:Percepciones', NS)
                if percepciones is not None:
                    data['nomina_gravado'] = float(percepciones.get('TotalGravado', 0))
                    data['nomina_exento'] = float(percepciones.get('TotalExento', 0))

                    for p in percepciones.findall('nomina12:Percepcion', NS):
                        tipo = p.get('TipoPercepcion')
                        exento = float(p.get('ImporteExento', 0))
                        gravado = float(p.get('ImporteGravado', 0))
                        concepto = p.get('Concepto', 'Otros')
                        
                        data['percepciones_detalle'].append({
                            'tipo': tipo,
                            'concepto': concepto,
                            'gravado': gravado,
                            'exento': exento,
                            'total': gravado + exento
                        })

                        if exento > 0:
                            if tipo == '002': # Aguinaldo
                                data['nomina_detalle_exento']['aguinaldo'] += exento
                            elif tipo == '003': # PTU
                                data['nomina_detalle_exento']['ptu'] += exento
                            elif tipo == '021': # Prima Vacacional
                                data['nomina_detalle_exento']['prima_vacacional'] += exento
                            elif tipo == '024': # Prima Dominical
                                data['nomina_detalle_exento']['prima_dominical'] += exento
                            else:
                                data['nomina_detalle_exento']['otros'] += exento
                                data['nomina_detalle_exento']['desglose_otros'].append({
                                    'concepto': concepto,
                                    'importe': exento,
                                    'tipo': tipo
                                })

                deducciones = nomina.find('nomina12:Deducciones', NS)
                if deducciones is not None:
                    for d in deducciones.findall('nomina12:Deduccion', NS):
                        data['deducciones_detalle'].append({
                            'tipo': d.get('TipoDeduccion'),
                            'concepto': d.get('Concepto', ''),
                            'importe': float(d.get('Importe', 0))
                        })

                otros_pagos = nomina.find('nomina12:OtrosPagos', NS)
                if otros_pagos is not None:
                    for op in otros_pagos.findall('nomina12:OtroPago', NS):
                        data['percepciones_detalle'].append({
                            'tipo': 'OP-' + op.get('TipoOtroPago', '999'),
                            'concepto': op.get('Concepto', ''),
                            'gravado': float(op.get('Importe', 0)),
                            'exento': 0.0,
                            'total': float(op.get('Importe', 0)),
                            'es_otro_pago': True
                        })

        # Restore missing common fields
        data.update({
            'total': total,
            'moneda': moneda,
            'tipo': tipo_comprobante,
            'categoria': category,
            'total_pago': total_pago,
            'forma_pago': forma_pago,
            'filename': os.path.basename(xml_path)
        })

        return data
    except Exception as e:
        print(f"Error parsing {xml_path}: {e}")
        return None

def process_directory(directory: str) -> List[Dict]:
    results = []
    if not os.path.exists(directory):
        return results

    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.xml'):
                full_path = os.path.join(root, file)
                parsed = parse_cfdi(full_path)
                if parsed:
                    results.append(parsed)
    return results
