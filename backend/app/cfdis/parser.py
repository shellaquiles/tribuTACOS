"""
Parser universal de CFDIs (Comprobantes Fiscales Digitales por Internet).
Soporta CFDI 3.3, CFDI 4.0, Complemento de Nómina 1.2, Complemento de Pagos 2.0 y Retenciones.
"""

import os
from typing import List, Dict, Any, Optional
from lxml import etree


NS_DEFAULT = {
    'cfdi': 'http://www.sat.gob.mx/cfd/4',
    'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
    'nomina12': 'http://www.sat.gob.mx/nomina12'
}


def parse_cfdi(xml_path: str, user_rfc: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Parsea un archivo CFDI XML (3.3 / 4.0 / Nómina / Retenciones / Pagos) y extrae datos estructurados.
    Si se especifica user_rfc, clasifica la categoría de ingreso/egreso respecto a ese RFC.
    """
    try:
        tree = etree.parse(xml_path)
        root = tree.getroot()

        # Dynamic CFDI namespace to support both 3.3 and 4.0 files
        ns_cfdi = root.tag.split('}')[0].strip('{') if '}' in root.tag else 'http://www.sat.gob.mx/cfd/4'
        ns = {
            'cfdi': ns_cfdi,
            'tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
            'nomina12': 'http://www.sat.gob.mx/nomina12'
        }

        # Basic attributes
        fecha_str = root.get('Fecha')
        subtotal = float(root.get('SubTotal', 0) or 0)
        descuento = float(root.get('Descuento', 0) or 0)
        total = float(root.get('Total', 0) or 0)
        moneda = root.get('Moneda', 'MXN')
        tipo_comprobante = root.get('TipoDeComprobante')

        # Emisor and Receptor details
        emisor = root.find('cfdi:Emisor', ns)
        emisor_rfc = emisor.get('Rfc') if emisor is not None else None
        emisor_nombre = emisor.get('Nombre') if emisor is not None else None
        emisor_regimen = emisor.get('RegimenFiscal') if emisor is not None else None

        receptor = root.find('cfdi:Receptor', ns)
        receptor_rfc = receptor.get('Rfc') if receptor is not None else None
        receptor_nombre = receptor.get('Nombre') if receptor is not None else None
        uso_cfdi = receptor.get('UsoCFDI') if receptor is not None else None

        # Timbre Fiscal (UUID)
        complemento = root.find('cfdi:Complemento', ns)
        uuid = None
        if complemento is not None:
            tfd = complemento.find('tfd:TimbreFiscalDigital', ns)
            if tfd is not None:
                uuid = tfd.get('UUID')

        metodo_pago = root.get('MetodoPago')
        forma_pago = root.get('FormaPago')

        # Determine Category
        category = "unknown"
        if tipo_comprobante == 'N':
            category = "nomina"
        elif tipo_comprobante == 'P':
            category = "pago"
        elif user_rfc:
            user_rfc_clean = user_rfc.strip().upper()
            emisor_rfc_clean = (emisor_rfc or '').strip().upper()
            receptor_rfc_clean = (receptor_rfc or '').strip().upper()

            if emisor_rfc_clean == user_rfc_clean:
                category = "ingreso" if tipo_comprobante == 'I' else "egreso_ingreso"
            elif receptor_rfc_clean == user_rfc_clean:
                category = "egreso" if tipo_comprobante == 'I' else "egreso_egreso"
            else:
                category = "ingreso" if tipo_comprobante == 'I' else "egreso"
        else:
            category = "ingreso" if tipo_comprobante == 'I' else ("egreso" if tipo_comprobante == 'E' else "otro")

        # Taxes: Traslados and Retenciones
        impuestos_root = root.find('cfdi:Impuestos', ns)
        iva_trasladado = 0.0
        retencion_iva = 0.0
        retencion_isr = 0.0

        if impuestos_root is not None:
            traslados = impuestos_root.find('cfdi:Traslados', ns)
            if traslados is not None:
                for t in traslados.findall('cfdi:Traslado', ns):
                    if t.get('Impuesto') == '002':  # IVA
                        iva_trasladado += float(t.get('Importe', 0) or 0)

            retenciones = impuestos_root.find('cfdi:Retenciones', ns)
            if retenciones is not None:
                for r in retenciones.findall('cfdi:Retencion', ns):
                    imp = r.get('Impuesto')
                    val = float(r.get('Importe', 0) or 0)
                    if imp == '001':  # ISR
                        retencion_isr += val
                    elif imp == '002':  # IVA
                        retencion_iva += val

        # Special case: Payments (Complemento de Pago 2.0 / 1.0)
        total_pago = 0.0
        pagos_detalle = []
        if category == "pago" and complemento is not None:
            pagos = complemento.find('{http://www.sat.gob.mx/Pagos20}Pagos')
            if pagos is None:
                pagos = complemento.find('{http://www.sat.gob.mx/Pagos}Pagos')
            if pagos is not None:
                totales = pagos.find('{http://www.sat.gob.mx/Pagos20}Totales')
                if totales is not None:
                    total_pago = float(totales.get('MontoTotalPagos', 0) or 0)

                for p in (pagos.findall('{http://www.sat.gob.mx/Pagos20}Pago') or pagos.findall('{http://www.sat.gob.mx/Pagos}Pago')):
                    fecha_p = p.get('FechaPago')
                    for dr in (p.findall('{http://www.sat.gob.mx/Pagos20}DoctoRelacionado') or p.findall('{http://www.sat.gob.mx/Pagos}DoctoRelacionado')):
                        pagos_detalle.append({
                            'uuid_rel': dr.get('IdDocumento'),
                            'monto': float(dr.get('ImpPagado', 0) or 0),
                            'parcialidad': dr.get('NumParcialidad'),
                            'fecha_pago': fecha_p
                        })

        # Special case: Payroll (Nómina) deductions as ISR retention
        if category == "nomina" and complemento is not None:
            nomina12 = complemento.find('.//nomina12:Nomina', namespaces={'nomina12': 'http://www.sat.gob.mx/nomina12'})
            if nomina12 is not None:
                isr_detalle = 0.0
                total_deducciones = nomina12.find('.//nomina12:Deducciones', namespaces={'nomina12': 'http://www.sat.gob.mx/nomina12'})
                if total_deducciones is not None:
                    for d in total_deducciones.findall('.//nomina12:Deduccion', namespaces={'nomina12': 'http://www.sat.gob.mx/nomina12'}):
                        if d.get('TipoDeduccion') == '002':  # ISR
                            isr_detalle += float(d.get('Importe', 0) or 0)

                if retencion_isr == 0 and isr_detalle > 0:
                    retencion_isr = isr_detalle

        # Special case: Retenciones e Intereses
        es_interes = False
        int_nom = 0.0
        int_real = 0.0

        retenciones_root = root.tag.endswith('Retenciones')
        if retenciones_root or 'Retenciones' in root.tag:
            category = "retencion"
            es_interes = True
            comple = root.find('{http://www.sat.gob.mx/esquemas/retencionpago/1}Complemento')
            if comple is not None:
                int_node = comple.find('{http://www.sat.gob.mx/esquemas/retencionpago/1/intereses}Intereses')
                if int_node is not None:
                    int_nom = float(int_node.get('MontIntNominal', 0) or 0)
                    int_real = float(int_node.get('MontIntReal', 0) or 0)

        # Base data dictionary
        data: Dict[str, Any] = {
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
                'desglose_otros': []
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

        # Conceptos analysis
        conceptos_list = []
        conceptos_node = root.find('cfdi:Conceptos', ns)
        if conceptos_node is not None:
            for c in conceptos_node.findall('cfdi:Concepto', ns):
                desc = c.get('Descripcion', '')
                imp = float(c.get('Importe', 0) or 0)
                clave = c.get('ClaveProdServ', '00000000')
                no_id = c.get('NoIdentificacion', desc)
                desc_cat = desc.title() if desc else 'Servicio profesional'

                conceptos_list.append({
                    'desc': desc.upper(),
                    'imp': imp,
                    'clave': clave,
                    'desc_sat': desc_cat,
                    'no_id': no_id.title() if no_id == desc else no_id
                })
                if 'interé' in desc.lower() or 'intere' in desc.lower():
                    if data['es_interes']:
                        data['intereses_nominal'] += imp
                        if 'exento' not in desc.lower():
                            data['intereses_gravado'] += imp

        data['conceptos'] = conceptos_list

        # Payroll granular details
        if category == "nomina" and complemento is not None:
            nomina = complemento.find('nomina12:Nomina', ns)
            if nomina is not None:
                data['fecha_pago_nomina'] = nomina.get('FechaPago')
                data['fecha_inicial_pago'] = nomina.get('FechaInicialPago')
                data['fecha_final_pago'] = nomina.get('FechaFinalPago')

                dias_raw = nomina.get('NumDiasPagados')
                try:
                    data['num_dias_pagados'] = float(dias_raw) if dias_raw else 0.0
                except (ValueError, TypeError):
                    data['num_dias_pagados'] = 0.0

                receptor_node = nomina.find('nomina12:Receptor', ns)
                if receptor_node is not None:
                    data['salario_diario_integrado'] = float(receptor_node.get('SalarioDiarioIntegrado', 0) or 0)
                    data['salario_base_cot_apor'] = float(receptor_node.get('SalarioBaseCotApor', 0) or 0)

                percepciones = nomina.find('nomina12:Percepciones', ns)
                if percepciones is not None:
                    data['nomina_gravado'] = float(percepciones.get('TotalGravado', 0) or 0)
                    data['nomina_exento'] = float(percepciones.get('TotalExento', 0) or 0)

                    for p in percepciones.findall('nomina12:Percepcion', ns):
                        tipo = p.get('TipoPercepcion')
                        exento = float(p.get('ImporteExento', 0) or 0)
                        gravado = float(p.get('ImporteGravado', 0) or 0)
                        concepto = p.get('Concepto', 'Otros')

                        data['percepciones_detalle'].append({
                            'tipo': tipo,
                            'concepto': concepto,
                            'gravado': gravado,
                            'exento': exento,
                            'total': gravado + exento
                        })

                        if exento > 0:
                            if tipo == '002':
                                data['nomina_detalle_exento']['aguinaldo'] += exento
                            elif tipo == '003':
                                data['nomina_detalle_exento']['ptu'] += exento
                            elif tipo == '021':
                                data['nomina_detalle_exento']['prima_vacacional'] += exento
                            elif tipo == '024':
                                data['nomina_detalle_exento']['prima_dominical'] += exento
                            else:
                                data['nomina_detalle_exento']['otros'] += exento
                                data['nomina_detalle_exento']['desglose_otros'].append({
                                    'concepto': concepto,
                                    'importe': exento,
                                    'tipo': tipo
                                })

                deducciones = nomina.find('nomina12:Deducciones', ns)
                if deducciones is not None:
                    for d in deducciones.findall('nomina12:Deduccion', ns):
                        data['deducciones_detalle'].append({
                            'tipo': d.get('TipoDeduccion'),
                            'concepto': d.get('Concepto', ''),
                            'importe': float(d.get('Importe', 0) or 0)
                        })

                otros_pagos = nomina.find('nomina12:OtrosPagos', ns)
                if otros_pagos is not None:
                    for op in otros_pagos.findall('nomina12:OtroPago', ns):
                        data['percepciones_detalle'].append({
                            'tipo': 'OP-' + op.get('TipoOtroPago', '999'),
                            'concepto': op.get('Concepto', ''),
                            'gravado': float(op.get('Importe', 0) or 0),
                            'exento': 0.0,
                            'total': float(op.get('Importe', 0) or 0),
                            'es_otro_pago': True
                        })

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
    except Exception:
        # Silently skip corrupt/non-xml files
        return None
