import os
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Client, Cfdi, DeclaracionAnualSAT, PagoProvisionalSAT, AcusePagoSAT
from app.cfdis.engine import build_fiscal_summary

router = APIRouter(prefix="/api/sat_docs", tags=["sat_docs"])

MES_NAMES_BY_NUM = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
    7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}

@router.get("/summary")
def get_sat_docs_summary(
    year: str = Query(..., description="Año fiscal (ej. 2021, 2022, 2023, 2024, 2025)"),
    client_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Consulta SQL 100% Relacional e Indexada:
    Devuelve la radiografía oficial del SAT y pagos provisionales desde la Base de Datos.
    """
    # 1. Obtener cliente activo
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
    else:
        client = db.query(Client).first()

    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # 2. Consultar Declaración Anual Oficial en BD
    anual_rec = db.query(DeclaracionAnualSAT).filter(
        DeclaracionAnualSAT.client_id == client.id,
        DeclaracionAnualSAT.year == year
    ).order_by(
        DeclaracionAnualSAT.tipo_declaracion.desc(),
        DeclaracionAnualSAT.created_at.desc()
    ).first()

    anual_data = None
    if anual_rec:
        anual_data = {
            'archivo': os.path.basename(anual_rec.raw_pdf_path or ''),
            'tipo_declaracion': anual_rec.tipo_declaracion,
            'num_operacion': anual_rec.num_operacion,
            'fecha_presentacion': anual_rec.fecha_presentacion,
            'ingresos_acumulables_totales': anual_rec.ingresos_acumulables,
            'deducciones_personales': anual_rec.deducciones_personales,
            'base_gravable': anual_rec.base_gravable,
            'isr_tarifa': anual_rec.isr_tarifa,
            'pagos_provisionales_acreditados': anual_rec.pagos_provisionales_acreditados,
            'isr_retenido_total': anual_rec.isr_retenido,
            'saldo_a_favor': anual_rec.saldo_a_favor,
            'saldo_a_cargo': anual_rec.saldo_a_cargo,
            'parcialidades': anual_rec.parcialidades,
            'destino_saldo': anual_rec.destino_saldo,
            'clabe': anual_rec.clabe,
            'banco': anual_rec.banco,
            'raw_pdf_path': anual_rec.raw_pdf_path
        }

    # 3. Consultar Pagos Provisionales Mensuales en BD
    provs_db = db.query(PagoProvisionalSAT).filter(
        PagoProvisionalSAT.client_id == client.id,
        PagoProvisionalSAT.year == year
    ).all()

    # Gastos unificados desde el motor fiscal
    summary_data = build_fiscal_summary(client, year, db, use_cache=True)
    gastos_anuales_motor = summary_data.get('sections', {}).get('reporte_gastos', [])

    matriz_mensual = []
    for m_num in range(1, 13):
        m_name = MES_NAMES_BY_NUM[m_num]
        provs_mes = [p for p in provs_db if p.mes_numero == m_num]
        
        doc_vigente = None
        tiene_complementaria = False
        if provs_mes:
            provs_sorted = sorted(provs_mes, key=lambda x: (1 if x.tipo_declaracion == 'Complementaria' else 0, x.fecha_presentacion or ''))
            doc_vigente = provs_sorted[-1]
            tiene_complementaria = any(p.tipo_declaracion == 'Complementaria' for p in provs_mes)

        mm_str = f"{m_num:02d}"

        # Facturación emitida en el mes
        xmls_emitidos = db.query(Cfdi).filter(
            Cfdi.client_id == client.id,
            Cfdi.emisor_rfc == client.rfc,
            Cfdi.fecha.like(f"{year}-{mm_str}%")
        ).all()
        xml_ingresos_subtotal = sum(x.subtotal or 0.0 for x in xmls_emitidos)
        xml_iva_trasladado = sum(x.iva or 0.0 for x in xmls_emitidos)
        xml_isr_retenido = sum(x.retencion_isr or 0.0 for x in xmls_emitidos)
        xml_iva_retenido = sum(x.retencion_iva or 0.0 for x in xmls_emitidos)

        # Gastos deducibles en el mes
        gastos_del_mes = [g for g in gastos_anuales_motor if (g.get('fecha') or '').startswith(f"{year}-{mm_str}")]
        xml_gastos_subtotal = sum(g.get('subtotal', 0.0) for g in gastos_del_mes)
        xml_iva_acreditable = sum(g.get('iva', 0.0) for g in gastos_del_mes)

        # Determinar pago efectivo (del acuse o de la declaración)
        total_pago_efectivo = 0.0
        if doc_vigente:
            if doc_vigente.tiene_acuse_pago and doc_vigente.total_pagado_acuse > 0:
                total_pago_efectivo = doc_vigente.total_pagado_acuse
            else:
                total_pago_efectivo = (doc_vigente.isr_a_cargo or 0.0) + (doc_vigente.iva_a_cargo or 0.0)

        matriz_mensual.append({
            'mes_numero': m_num,
            'mes_nombre': m_name,
            'estatus': 'Presentada' if doc_vigente else ('Futura' if int(year) >= 2026 and m_num > 2 else 'Pendiente'),
            'tipo_declaracion': doc_vigente.tipo_declaracion if doc_vigente else 'N/A',
            'tiene_complementaria': tiene_complementaria,
            'num_operacion': doc_vigente.num_operacion if doc_vigente else '',
            'fecha_presentacion': doc_vigente.fecha_presentacion if doc_vigente else '',
            
            # Datos ISR
            'isr_ingresos_mes': doc_vigente.isr_ingresos_periodo if doc_vigente else 0.0,
            'isr_ingresos_acumulados': doc_vigente.isr_ingresos_acumulados if doc_vigente else 0.0,
            'isr_deducciones_declaradas': doc_vigente.isr_deducciones_autorizadas if doc_vigente else 0.0,
            'isr_a_cargo_sat': doc_vigente.isr_a_cargo if doc_vigente else 0.0,
            'isr_retenido_sat': doc_vigente.isr_retenido_periodo if doc_vigente else 0.0,
            'xml_ingresos_facturados': round(xml_ingresos_subtotal, 2),
            'xml_isr_retenido': round(xml_isr_retenido, 2),
            
            # Datos IVA
            'iva_cobrado_sat': doc_vigente.iva_cobrado_16 if doc_vigente else 0.0,
            'iva_acreditable_sat': doc_vigente.iva_acreditable_gastos if doc_vigente else 0.0,
            'iva_retenido_sat': doc_vigente.iva_retenido if doc_vigente else 0.0,
            'iva_a_cargo_sat': doc_vigente.iva_a_cargo if doc_vigente else 0.0,
            'xml_iva_trasladado': round(xml_iva_trasladado, 2),
            'xml_iva_acreditable': round(xml_iva_acreditable, 2),
            'xml_iva_retenido': round(xml_iva_retenido, 2),
            
            # Pago y Acuse
            'total_pago_efectivo': total_pago_efectivo,
            'tiene_acuse_pago': doc_vigente.tiene_acuse_pago if doc_vigente else False,
            'raw_pdf_path': doc_vigente.raw_pdf_path if doc_vigente else None,
            'raw_acuse_path': doc_vigente.raw_acuse_path if doc_vigente else None,
            'detalle_oficial_completo': json.loads(doc_vigente.parsed_json) if doc_vigente and doc_vigente.parsed_json else None
        })

    # Ajustar variaciones mensuales de ingresos
    for idx in range(len(matriz_mensual)):
        if matriz_mensual[idx]['estatus'] == 'Presentada':
            if matriz_mensual[idx]['isr_ingresos_mes'] == 0.0 and idx > 0 and matriz_mensual[idx-1]['estatus'] == 'Presentada':
                dif_mes = max(0.0, matriz_mensual[idx]['isr_ingresos_acumulados'] - matriz_mensual[idx-1]['isr_ingresos_acumulados'])
                matriz_mensual[idx]['isr_ingresos_mes'] = dif_mes
            elif idx == 0 and matriz_mensual[idx]['isr_ingresos_mes'] == 0.0:
                matriz_mensual[idx]['isr_ingresos_mes'] = matriz_mensual[idx]['isr_ingresos_acumulados']

    # 4. Años con Anual disponible en BD
    anios_db = [r[0] for r in db.query(DeclaracionAnualSAT.year).filter(DeclaracionAnualSAT.client_id == client.id).distinct().all()]
    if not anios_db: anios_db = ['2021', '2022', '2023', '2024', '2025']

    return {
        'year': year,
        'declaracion_anual_oficial': anual_data,
        'tiene_anual_presentada': anual_data is not None,
        'matriz_pagos_provisionales': matriz_mensual,
        'meses_presentados_count': sum(1 for m in matriz_mensual if m['estatus'] == 'Presentada'),
        'total_isr_declarado_anual': sum(m['isr_a_cargo_sat'] for m in matriz_mensual),
        'total_iva_declarado_anual': sum(m['iva_a_cargo_sat'] for m in matriz_mensual),
        'anios_con_anual_disponible': sorted(anios_db),
        'sections': summary_data.get('sections', {})
    }


@router.get("/pdf")
def get_sat_doc_pdf(
    path: str = Query(..., description="Ruta del archivo PDF a descargar o visualizar"),
    db: Session = Depends(get_db)
):
    """Permite ver/descargar directamente el archivo PDF oficial del SAT."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Archivo PDF no encontrado")
    return FileResponse(path, media_type="application/pdf", filename=os.path.basename(path))
