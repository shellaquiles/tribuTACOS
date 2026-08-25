"""
Importador y sincronizador de documentos oficiales SAT (Declaraciones Anuales,
Pagos Provisionales y Acuses de Recibo en PDF) hacia SQLite/PostgreSQL.
"""

import os
import re
import json
import glob
from typing import Dict, List, Any, Optional
from pathlib import Path
from sqlalchemy.orm import Session

from app.config import DESCARGADOS_DIR
from app.models import Client, DeclaracionAnualSAT, PagoProvisionalSAT, AcusePagoSAT
from app.sat_docs.parser import (
    parse_declaracion_anual,
    parse_pago_provisional,
    extract_text_from_pdf,
    MES_NAMES_BY_NUM,
    MESES_MAP
)


def parse_acuse_pago(pdf_path: str, default_rfc: str = "") -> Dict[str, Any]:
    """Parsea un Acuse de Recibo de Pago de Contribuciones Federales del SAT."""
    txt = extract_text_from_pdf(pdf_path)
    fn = os.path.basename(pdf_path)

    data = {
        'archivo': fn,
        'tipo': 'Acuse_Pago',
        'rfc': default_rfc or '',
        'year': '',
        'mes_numero': 0,
        'periodo': '',
        'num_operacion': '',
        'fecha_presentacion': '',
        'monto_isr_pagado': 0.0,
        'monto_iva_pagado': 0.0,
        'total_pagado': 0.0
    }

    m_rfc = re.search(r'RFC:\s*([A-Z0-9]+)', txt)
    if m_rfc:
        data['rfc'] = m_rfc.group(1)

    m_ej = re.search(r'Ejercicio:?\s*(\d{4})', txt)
    if m_ej:
        data['year'] = m_ej.group(1)
    else:
        fn_ej = re.search(r'202\d', fn)
        if fn_ej:
            data['year'] = fn_ej.group(0)

    m_per = re.search(r'Per[íi]odo(?: de la declaraci[oó]n)?:?\s*([A-Za-záéíóúÁÉÍÓÚ]+)', txt)
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

    m_op = re.search(r'N[uú]mero de operaci[oó]n:?\s*(\d+)', txt, re.IGNORECASE) or re.search(r'Op(\d+)', fn)
    if m_op:
        data['num_operacion'] = m_op.group(1) if hasattr(m_op, 'group') else str(m_op)

    m_fp = re.search(r'Fecha y hora de presentaci[oó]n:?\s*([^\n]+)', txt, re.IGNORECASE)
    if m_fp:
        data['fecha_presentacion'] = m_fp.group(1).strip()

    # Extraer montos de conceptos
    m_isr = re.search(r'ISR PERSONAS FÍSICAS[^\n]*\n.*?Cantidad a pagar:\s*([\d,]+)', txt, re.DOTALL)
    if m_isr:
        data['monto_isr_pagado'] = float(m_isr.group(1).replace(',', ''))

    m_iva = re.search(r'IMPUESTO AL VALOR AGREGADO[^\n]*\n.*?Cantidad a pagar:\s*([\d,]+)', txt, re.DOTALL)
    if m_iva:
        data['monto_iva_pagado'] = float(m_iva.group(1).replace(',', ''))

    data['total_pagado'] = data['monto_isr_pagado'] + data['monto_iva_pagado']

    return data


def sync_all_sat_documents_to_db(
    db: Session,
    client: Client,
    descargados_path: Optional[str] = None
) -> Dict[str, int]:
    """
    Ingesta transaccional: parsea todos los PDFs oficiales y los persiste en la BD relacional.
    """
    target_path = str(descargados_path or DESCARGADOS_DIR)
    stats = {'anuales': 0, 'provisionales': 0, 'acuses': 0}

    if not os.path.exists(target_path):
        return stats

    # 1. Ingestar Declaraciones Anuales
    anuales_files = glob.glob(os.path.join(target_path, "Declaraciones_Anuales", "*.pdf"))
    for f in anuales_files:
        try:
            parsed = parse_declaracion_anual(f)
            yr = parsed.get('ejercicio')
            if not yr:
                continue

            pk_id = f"{client.rfc}_{yr}_{parsed.get('num_operacion') or 'anual'}"
            rec = db.query(DeclaracionAnualSAT).filter(DeclaracionAnualSAT.id == pk_id).first()
            if not rec:
                rec = DeclaracionAnualSAT(id=pk_id, client_id=client.id, rfc=client.rfc, year=yr)
                db.add(rec)

            rec.tipo_declaracion = parsed.get('tipo_declaracion', 'Normal')
            rec.num_operacion = parsed.get('num_operacion', '')
            rec.fecha_presentacion = parsed.get('fecha_presentacion', '')
            rec.ingresos_acumulables = parsed.get('ingresos_acumulables_totales', 0.0)
            rec.deducciones_personales = parsed.get('deducciones_personales', 0.0)
            rec.base_gravable = parsed.get('base_gravable', 0.0)
            rec.isr_tarifa = parsed.get('isr_tarifa', 0.0)
            rec.pagos_provisionales_acreditados = parsed.get('pagos_provisionales_acreditados', 0.0)
            rec.isr_retenido = parsed.get('isr_retenido_total', 0.0)
            rec.saldo_a_favor = parsed.get('saldo_a_favor', 0.0)
            rec.saldo_a_cargo = parsed.get('saldo_a_cargo', 0.0)
            rec.parcialidades = parsed.get('parcialidades', 0)
            rec.destino_saldo = parsed.get('destino_saldo', '')
            rec.clabe = parsed.get('clabe', '')
            rec.banco = parsed.get('banco', '')
            rec.raw_pdf_path = f
            rec.parsed_json = json.dumps(parsed, ensure_ascii=False)
            stats['anuales'] += 1
        except Exception as e:
            print(f"[SAT Docs Importer] Error ingestando anual {f}: {e}")

    # 2. Ingestar Pagos Provisionales
    prov_files = glob.glob(os.path.join(target_path, "Pagos_Provisionales", "*", "*.pdf"))
    for f in prov_files:
        try:
            parsed = parse_pago_provisional(f)
            yr = parsed.get('ejercicio')
            m_num = parsed.get('mes_numero', 0)
            if not yr or m_num == 0:
                continue

            pk_id = f"{client.rfc}_{yr}_{m_num:02d}_{parsed.get('num_operacion') or 'prov'}"
            rec = db.query(PagoProvisionalSAT).filter(PagoProvisionalSAT.id == pk_id).first()
            if not rec:
                rec = PagoProvisionalSAT(id=pk_id, client_id=client.id, rfc=client.rfc, year=yr, mes_numero=m_num)
                db.add(rec)

            rec.mes_nombre = parsed.get('periodo', MES_NAMES_BY_NUM.get(m_num, ''))
            rec.tipo_declaracion = parsed.get('tipo_declaracion', 'Normal')
            rec.num_operacion = parsed.get('num_operacion', '')
            rec.fecha_presentacion = parsed.get('fecha_presentacion', '')
            rec.isr_ingresos_periodo = parsed.get('isr_ingresos_periodo', 0.0)
            rec.isr_ingresos_acumulados = parsed.get('isr_ingresos_acumulados', 0.0)
            rec.isr_deducciones_autorizadas = parsed.get('isr_deducciones_autorizadas', 0.0)
            rec.isr_base_gravable = parsed.get('isr_base_gravable', 0.0)
            rec.isr_causado = parsed.get('isr_causado', 0.0)
            rec.isr_retenido_periodo = parsed.get('isr_retenido_periodo', 0.0)
            rec.isr_a_cargo = parsed.get('isr_a_cargo', 0.0)
            rec.iva_base_gravada_16 = parsed.get('iva_base_gravada_16', 0.0)
            rec.iva_cobrado_16 = parsed.get('iva_cobrado_16', 0.0)
            rec.iva_acreditable_gastos = parsed.get('iva_acreditable_gastos', 0.0)
            rec.iva_retenido = parsed.get('iva_retenido', 0.0)
            rec.iva_a_cargo = parsed.get('iva_a_cargo', 0.0)
            rec.total_pagado = parsed.get('total_pagar', 0.0)
            rec.raw_pdf_path = f
            rec.parsed_json = json.dumps(parsed, ensure_ascii=False)
            stats['provisionales'] += 1
        except Exception as e:
            print(f"[SAT Docs Importer] Error ingestando provisional {f}: {e}")

    # 3. Ingestar Acuses de Pagos de Contribuciones Federales
    acuse_files = glob.glob(os.path.join(target_path, "Acuses_Pagos", "*", "*.pdf"))
    for f in acuse_files:
        try:
            parsed = parse_acuse_pago(f, default_rfc=client.rfc)
            yr = parsed.get('year')
            m_num = parsed.get('mes_numero', 0)
            num_op = parsed.get('num_operacion', '')
            if not yr:
                continue

            pk_id = f"{client.rfc}_{yr}_{m_num:02d}_Acuse_{num_op}"
            rec = db.query(AcusePagoSAT).filter(AcusePagoSAT.id == pk_id).first()
            if not rec:
                rec = AcusePagoSAT(id=pk_id, client_id=client.id, rfc=client.rfc, year=yr, mes_numero=m_num)
                db.add(rec)

            rec.num_operacion = num_op
            rec.fecha_presentacion = parsed.get('fecha_presentacion', '')
            rec.monto_isr_pagado = parsed.get('monto_isr_pagado', 0.0)
            rec.monto_iva_pagado = parsed.get('monto_iva_pagado', 0.0)
            rec.total_pagado = parsed.get('total_pagado', 0.0)
            rec.raw_pdf_path = f

            # Cruzar con el pago provisional mensual correspondiente
            if num_op:
                prov_match = db.query(PagoProvisionalSAT).filter(
                    PagoProvisionalSAT.client_id == client.id,
                    PagoProvisionalSAT.num_operacion == num_op
                ).first()
                if prov_match:
                    prov_match.tiene_acuse_pago = True
                    prov_match.total_pagado_acuse = rec.total_pagado
                    prov_match.raw_acuse_path = f

            stats['acuses'] += 1
        except Exception as e:
            print(f"[SAT Docs Importer] Error ingestando acuse de pago {f}: {e}")

    db.commit()
    return stats
