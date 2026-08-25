import os
import re
import json
import glob
import subprocess
from typing import Dict, List, Any, Optional

MESES_MAP = {
    'ENERO': '01_Ene', 'FEBRERO': '02_Feb', 'MARZO': '03_Mar', 'ABRIL': '04_Abr',
    'MAYO': '05_May', 'JUNIO': '06_Jun', 'JULIO': '07_Jul', 'AGOSTO': '08_Ago',
    'SEPTIEMBRE': '09_Sep', 'OCTUBRE': '10_Oct', 'NOVIEMBRE': '11_Nov', 'DICIEMBRE': '12_Dic'
}

MES_NAMES_BY_NUM = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
    7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}

def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        res = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return res.stdout
    except Exception as e:
        print(f"Error extrayendo texto de {pdf_path}: {e}")
        return ""

def clean_num(val_str: Optional[str]) -> float:
    if not val_str: return 0.0
    val_clean = val_str.replace(',', '').replace('$', '').strip()
    try:
        return float(val_clean)
    except:
        return 0.0

def parse_declaracion_anual(pdf_path: str) -> Dict[str, Any]:
    """Extrae TODOS los campos exhaustivos de la Declaración Anual del SAT."""
    txt = extract_text_from_pdf(pdf_path)
    fn = os.path.basename(pdf_path)

    data = {
        'archivo': fn,
        'tipo': 'Declaracion_Anual',
        'rfc': 'SHLL250825XYZ',
        'nombre': 'pixelead0 Shellaquiles org',
        'curp': '',
        'ejercicio': '',
        'num_operacion': '',
        'fecha_presentacion': '',
        'tipo_declaracion': 'Normal',
        
        # Determinación de ISR Anual
        'ingresos_acumulables_totales': 0.0,
        'ingresos_no_acumulables': 0.0,
        'ingresos_exentos': 0.0,
        'deducciones_personales': 0.0,
        'base_gravable': 0.0,
        'isr_tarifa': 0.0,
        'pagos_provisionales_acreditados': 0.0,
        'isr_retenido_total': 0.0,
        'impuesto_acreditable_pagado_extranjero': 0.0,
        'saldo_a_favor': 0.0,
        'saldo_a_cargo': 0.0,
        'parcialidades': 0,
        'importe_primera_parcialidad': 0.0,
        'destino_saldo': '',
        'clabe': '',
        'banco': '',
        'perdidas_anteriores': [],
        'campos_completos': {}
    }

    # RFC, CURP, Nombre
    m_rfc = re.search(r'RFC:\s*([A-Z0-9]+)', txt)
    if m_rfc: data['rfc'] = m_rfc.group(1)

    m_curp = re.search(r'CURP:\s*([A-Z0-9]+)', txt)
    if m_curp: data['curp'] = m_curp.group(1)

    m_ej = re.search(r'Ejercicio:\s*(\d{4})', txt)
    if m_ej: data['ejercicio'] = m_ej.group(1)
    else:
        fn_ej = re.search(r'202\d', fn)
        if fn_ej: data['ejercicio'] = fn_ej.group(0)

    m_op = re.search(r'Número de operación:?\s*(\d+)', txt) or re.search(r'Op(\d+)', fn)
    if m_op: data['num_operacion'] = m_op.group(1) if hasattr(m_op, 'group') else str(m_op)

    m_fp = re.search(r'Fecha y hora de presentación:\s*([^\n]+)', txt)
    if m_fp: data['fecha_presentacion'] = m_fp.group(1).strip()

    if re.search(r'Complementaria', txt, re.IGNORECASE) or 'Complementaria' in fn:
        data['tipo_declaracion'] = "Complementaria"

    # Determinación del impuesto
    det_first_idx = txt.find("DETERMINACIÓN DEL IMPUESTO")
    source_txt = txt[det_first_idx:] if det_first_idx != -1 else txt

    m_ded = re.search(r'DEDUCCIONES PERSONALES\s+([\d,]+)', source_txt)
    if m_ded: data['deducciones_personales'] = clean_num(m_ded.group(1))

    m_base = re.search(r'BASE GRAVABLE\s+([\d,]+)', source_txt)
    if m_base: data['base_gravable'] = clean_num(m_base.group(1))

    m_isr_tar = re.search(r'ISR CONFORME A LA TARIFA ANUAL\s+([\d,]+)', source_txt)
    if m_isr_tar: data['isr_tarifa'] = clean_num(m_isr_tar.group(1))

    m_pag_prov = re.search(r'PAGOS PROVISIONALES\s+([\d,]+)', source_txt)
    if m_pag_prov: data['pagos_provisionales_acreditados'] = clean_num(m_pag_prov.group(1))

    m_ret = re.search(r'ISR RETENIDO\s+([\d,]+)', source_txt)
    if m_ret: data['isr_retenido_total'] = clean_num(m_ret.group(1))

    m_fav = re.search(r'IMPUESTO A FAVOR DEL EJERCICIO\s+([\d,]+)', source_txt) or re.search(r'A FAVOR\s+([\d,]+)', source_txt)
    if m_fav: data['saldo_a_favor'] = clean_num(m_fav.group(1))

    m_cargo = re.search(r'IMPUESTO A CARGO DEL EJERCICIO\s+([\d,]+)', source_txt) or \
              re.search(r'CANTIDAD A CARGO\s+([\d,]+)', source_txt) or \
              re.search(r'A CARGO\s+([\d,]+)', source_txt)
    if m_cargo: data['saldo_a_cargo'] = clean_num(m_cargo.group(1))

    m_parc = re.search(r'NÚMERO DE PARCIALIDADES\s+(\d+)', source_txt)
    if m_parc: data['parcialidades'] = int(m_parc.group(1))

    if data['base_gravable'] > 0:
        data['ingresos_acumulables_totales'] = data['base_gravable'] + data['deducciones_personales']
    else:
        m_acum_all = re.findall(r'INGRESOS ACUMULABLES\s+([\d,]+)', txt)
        if m_acum_all:
            data['ingresos_acumulables_totales'] = clean_num(m_acum_all[-1])

    m_dest = re.search(r'¿QUÉ DESEAS HACER CON TU SALDO A FAVOR\?\s+([A-ZÁÉÍÓÚ]+)', txt)
    if m_dest: data['destino_saldo'] = m_dest.group(1).title()

    m_clabe = re.search(r'NÚMERO DE CUENTA CLABE\s+(\d+)', txt)
    if m_clabe: data['clabe'] = m_clabe.group(1)

    m_banco = re.search(r'NOMBRE DEL BANCO\s+([^\n]+)', txt)
    if m_banco: data['banco'] = m_banco.group(1).strip()

    # Pérdidas fiscales
    perdidas_matches = re.findall(r'(\d{4})\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', txt)
    for p in perdidas_matches:
        if int(p[0]) < int(data['ejercicio'] or 2030):
            data['perdidas_anteriores'].append({
                'anio_origen': p[0],
                'perdida_historica': clean_num(p[1]),
                'perdida_actualizada': clean_num(p[2]),
                'aplicada': clean_num(p[3]),
                'remanente': clean_num(p[4])
            })

    return data


def parse_pago_provisional(pdf_path: str) -> Dict[str, Any]:
    """Extrae la totalidad de los renglones oficiales de la Declaración Provisional Mensual."""
    txt = extract_text_from_pdf(pdf_path)
    fn = os.path.basename(pdf_path)

    data = {
        'archivo': fn,
        'tipo': 'Pago_Provisional',
        'rfc': 'SHLL250825XYZ',
        'curp': '',
        'ejercicio': '',
        'periodo': '',
        'mes_numero': 0,
        'num_operacion': '',
        'fecha_presentacion': '',
        'tipo_declaracion': 'Normal',
        
        # ── 1. ISR: SECCIÓN R122 ACTIVIDAD EMPRESARIAL Y PROFESIONAL ──
        'isr_ingresos_periodos_anteriores': 0.0,
        'isr_ingresos_periodo': 0.0,
        'isr_total_ingresos': 0.0,
        'isr_ingresos_exentos': 0.0,
        'isr_ingresos_acumulados': 0.0,
        'isr_compras_periodos_anteriores': 0.0,
        'isr_compras_periodo': 0.0,
        'isr_deducciones_autorizadas': 0.0,
        'isr_facilidades_estimulos': 'NO',
        'isr_ptu_pagada': 0.0,
        'isr_perdidas_anteriores_aplicadas': 0.0,
        'isr_base_gravable': 0.0,
        'isr_causado': 0.0,
        'isr_pagos_provisionales_anteriores': 0.0,
        'isr_retenido_periodos_anteriores': 0.0,
        'isr_retenido_periodo': 0.0,
        'isr_impuesto_retenido_total': 0.0,
        'isr_pagos_anteriores_complementarias': 0.0,
        'isr_a_cargo': 0.0,

        # ── 2. IVA: SECCIÓN R21 DETERMINACIÓN DEL IVA ──
        'iva_base_gravada_16': 0.0,
        'iva_base_gravada_0': 0.0,
        'iva_base_exenta': 0.0,
        'iva_cobrado_16': 0.0,
        'iva_total_trasladado': 0.0,
        'iva_acreditable_anteriores': 0.0,
        'iva_acreditable_gastos': 0.0,
        'iva_total_acreditable': 0.0,
        'iva_retenido': 0.0,
        'iva_pagos_anteriores_complementarias': 0.0,
        'iva_a_cargo': 0.0,
        'iva_a_favor': 0.0,

        # ── 3. DETALLE GENERAL DEL PAGO ──
        'total_contribuciones': 0.0,
        'total_aplicaciones': 0.0,
        'cantidad_a_cargo': 0.0,
        'total_pagar': 0.0
    }

    # Encabezado
    m_rfc = re.search(r'RFC\s+([A-Z0-9]+)', txt)
    if m_rfc: data['rfc'] = m_rfc.group(1)

    m_curp = re.search(r'CURP\s+([A-Z0-9]+)', txt)
    if m_curp: data['curp'] = m_curp.group(1)

    m_op = re.search(r'N[uú]mero de\s+operaci[oó]n:?\s*(\d+)', txt, re.IGNORECASE) or re.search(r'NÚMERO DE\s+OPERACIÓN\s+(\d+)', txt) or re.search(r'Op(\d+)', fn)
    if m_op: data['num_operacion'] = m_op.group(1) if hasattr(m_op, 'group') else str(m_op)

    m_ej = re.search(r'Ejercicio:?\s*(\d{4})', txt) or re.search(r'EJERCICIO\s+(\d{4})', txt)
    if m_ej: data['ejercicio'] = m_ej.group(1)
    else:
        fn_ej = re.search(r'202\d', fn)
        if fn_ej: data['ejercicio'] = fn_ej.group(0)

    m_per = re.search(r'Per[íi]odo(?: de la declaraci[oó]n)?:?\s*([A-Za-záéíóúÁÉÍÓÚ]+)', txt) or re.search(r'PERIODO\s+([A-Za-záéíóúÁÉÍÓÚ]+)', txt)
    if m_per:
        p_raw = m_per.group(1).upper()
        if p_raw in MESES_MAP:
            data['periodo'] = p_raw.title()
            for m_num, m_name in MES_NAMES_BY_NUM.items():
                if m_name.upper() == p_raw:
                    data['mes_numero'] = m_num
                    break

    if data['mes_numero'] == 0:
        for m_num, m_name in MES_NAMES_BY_NUM.items():
            if m_name[:3].lower() in fn.lower():
                data['mes_numero'] = m_num
                data['periodo'] = m_name
                break

    if re.search(r'Complementaria', txt, re.IGNORECASE) or 'Complementaria' in fn:
        data['tipo_declaracion'] = "Complementaria"

    m_fp = re.search(r'Fecha y hora de presentación:\s*([^\n]+)', txt)
    if m_fp: data['fecha_presentacion'] = m_fp.group(1).strip()

    # ── EXTRAER TODOS LOS CAMPOS DE ISR (R122) ──
    m = re.search(r'INGRESOS DE PERIODOS\s+ANTERIORES\s+([\d,]+)', txt)
    if m: data['isr_ingresos_periodos_anteriores'] = clean_num(m.group(1))

    m = re.search(r'INGRESOS DEL PERIODO\s+([\d,]+)', txt)
    if m: data['isr_ingresos_periodo'] = clean_num(m.group(1))

    m = re.search(r'TOTAL DE INGRESOS\s+([\d,]+)', txt)
    if m: data['isr_total_ingresos'] = clean_num(m.group(1))

    m = re.search(r'INGRESOS EXENTOS\s+([\d,]+)', txt)
    if m: data['isr_ingresos_exentos'] = clean_num(m.group(1))

    m = re.search(r'TOTAL DE INGRESOS ACUMULABLES\s+([\d,]+)', txt) or re.search(r'TOTAL DE INGRESOS\s+([\d,]+)', txt)
    if m: data['isr_ingresos_acumulados'] = clean_num(m.group(1))
    else: data['isr_ingresos_acumulados'] = data['isr_ingresos_periodo']

    m = re.search(r'COMPRAS Y GASTOS DE PERIODOS\s+ANTERIORES\s+([\d,]+)', txt)
    if m: data['isr_compras_periodos_anteriores'] = clean_num(m.group(1))

    m = re.search(r'COMPRAS Y GASTOS DEL PERIODO\s+([\d,]+)', txt)
    if m: data['isr_compras_periodo'] = clean_num(m.group(1))

    m = re.search(r'TOTAL DE COMPRAS Y GASTOS\s+([\d,]+)', txt) or re.search(r'DEDUCCIONES AUTORIZADAS\s+([\d,]+)', txt)
    if m: data['isr_deducciones_autorizadas'] = clean_num(m.group(1))

    m = re.search(r'PARTICIPACIÓN DE LOS\s+TRABAJADORES EN LAS UTILIDADES\s+([\d,]+)', txt)
    if m: data['isr_ptu_pagada'] = clean_num(m.group(1))

    m = re.search(r'PÉRDIDAS FISCALES DE EJERCICIOS\s+ANTERIORES\s+([\d,]+)', txt)
    if m: data['isr_perdidas_anteriores_aplicadas'] = clean_num(m.group(1))

    m = re.search(r'BASE GRAVABLE DEL PAGO\s+PROVISIONAL\s+([\d,]+)', txt) or re.search(r'BASE GRAVABLE\s+([\d,]+)', txt)
    if m: data['isr_base_gravable'] = clean_num(m.group(1))

    m = re.search(r'ISR CAUSADO\s+([\d,]+)', txt)
    if m: data['isr_causado'] = clean_num(m.group(1))

    m = re.search(r'PAGOS PROVISIONALES\s+EFECTUADOS CON ANTERIORIDAD\s+([\d,]+)', txt)
    if m: data['isr_pagos_provisionales_anteriores'] = clean_num(m.group(1))

    m = re.search(r'ISR RETENIDO DE PERIODOS\s+ANTERIORES\s+([\d,]+)', txt)
    if m: data['isr_retenido_periodos_anteriores'] = clean_num(m.group(1))

    m = re.search(r'ISR RETENIDO DEL PERIODO\s+([\d,]+)', txt)
    if m: data['isr_retenido_periodo'] = clean_num(m.group(1))

    m = re.search(r'IMPUESTO RETENIDO\s+([\d,]+)', txt)
    if m: data['isr_impuesto_retenido_total'] = clean_num(m.group(1))

    m = re.search(r'ISR A CARGO\s+([\d,]+)', txt)
    if m: data['isr_a_cargo'] = clean_num(m.group(1))

    # ── EXTRAER TODOS LOS CAMPOS DE IVA (R21) ──
    m = re.search(r'ACTIVIDADES GRAVADAS A LA TASA\s+DEL 16%\s+([\d,]+)', txt)
    if m: data['iva_base_gravada_16'] = clean_num(m.group(1))

    m = re.search(r'ACTIVIDADES GRAVADAS A LA TASA\s+DEL 0%\s+([\d,]+)', txt)
    if m: data['iva_base_gravada_0'] = clean_num(m.group(1))

    m = re.search(r'ACTIVIDADES EXENTAS\s+([\d,]+)', txt)
    if m: data['iva_base_exenta'] = clean_num(m.group(1))

    m = re.search(r'IVA COBRADO DEL PERIODO A LA\s+TASA DEL 16%\s+([\d,]+)', txt)
    if m: data['iva_cobrado_16'] = clean_num(m.group(1))

    m = re.search(r'IVA ACREDITABLE DEL PERIODO\s+([\d,]+)', txt)
    if m: data['iva_acreditable_gastos'] = clean_num(m.group(1))

    m = re.search(r'IVA RETENIDO\s+([\d,]+)', txt)
    if m: data['iva_retenido'] = clean_num(m.group(1))

    m = re.search(r'R21 IMPUESTO AL VALOR AGREGADO\s+A CARGO\s+([\d,]+)', txt) or re.search(r'CANTIDAD A CARGO\s+([\d,]+)', txt)
    if m: data['iva_a_cargo'] = clean_num(m.group(1))

    # ── DETALLE GENERAL DEL PAGO ──
    m = re.search(r'TOTAL DE CONTRIBUCIONES\s+([\d,]+)', txt)
    if m: data['total_contribuciones'] = clean_num(m.group(1))

    m = re.search(r'TOTAL DE APLICACIONES\s+([\d,]+)', txt)
    if m: data['total_aplicaciones'] = clean_num(m.group(1))

    m = re.search(r'CANTIDAD A CARGO\s+([\d,]+)', txt)
    if m: data['cantidad_a_cargo'] = clean_num(m.group(1))

    m = re.search(r'TOTAL A PAGAR\s+([\d,]+)', txt) or re.search(r'Total a pagar:\s*\$?([\d,]+)', txt)
    if m: data['total_pagar'] = clean_num(m.group(1))

    return data
