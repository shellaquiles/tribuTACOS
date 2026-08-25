"""
Módulo de Seeding para Datos de Demostración y Pruebas en tribuTACOS.
Permite exportar e importar el dataset fiscal completo (CFDIs, declaraciones, acuses, parámetros)
para reproducir el entorno de pruebas en cualquier despliegue o CI/CD.
"""

import os
import gzip
import json
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.config import PROJECT_ROOT, BACKEND_DIR, DEFAULT_CLIENT_RFC, DEFAULT_CLIENT_NAME, DEFAULT_CLIENT_EMAIL
from app.models import (
    Client, Cfdi, DeclaracionAnualSAT, PagoProvisionalSAT,
    AcusePagoSAT, CfdiExclusion, ConstanciaFiscalExterna,
    TarifaIsrAnual, ParametroSat, SummaryCache
)
from app.cfdis.storage import ensure_default_client, scan_local_paths, invalidate_client_cache
from app.cfdis.engine import build_fiscal_summary
from app.sat_docs.importer import sync_all_sat_documents_to_db

SEEDS_DIR = Path(__file__).resolve().parent
DEFAULT_FIXTURE_PATH = SEEDS_DIR / "demo_dataset.json.gz"


def export_demo_fixture(db: Session, output_path: Optional[Path] = None) -> Path:
    """
    Exporta todos los registros de demostración desde la base de datos a un archivo comprimido .json.gz.
    """
    target = output_path or DEFAULT_FIXTURE_PATH
    target.parent.mkdir(parents=True, exist_ok=True)

    data: Dict[str, Any] = {
        "clients": [],
        "cfdis": [],
        "declaraciones_anuales_sat": [],
        "pagos_provisionales_sat": [],
        "acuses_pagos_sat": [],
        "cfdi_exclusions": [],
        "constancias_fiscales_externas": [],
        "parametros_sat": [],
        "tarifas_isr_anuales": []
    }

    # 1. Clientes
    for c in db.query(Client).all():
        data["clients"].append({
            "id": c.id,
            "name": c.name,
            "rfc": c.rfc,
            "email": c.email,
            "plan": c.plan,
            "local_path_emitidos": c.local_path_emitidos,
            "local_path_recibidos": c.local_path_recibidos
        })

    # 2. CFDIs
    for item in db.query(Cfdi).all():
        data["cfdis"].append({
            "id": item.id,
            "client_id": item.client_id,
            "filename": item.filename,
            "filepath": item.filepath,
            "categoria": item.categoria,
            "tipo": item.tipo,
            "fecha": item.fecha,
            "year": item.year,
            "emisor_rfc": item.emisor_rfc,
            "emisor_nombre": item.emisor_nombre,
            "receptor_rfc": item.receptor_rfc,
            "receptor_nombre": item.receptor_nombre,
            "uso_cfdi": item.uso_cfdi,
            "metodo_pago": item.metodo_pago,
            "forma_pago": item.forma_pago,
            "subtotal": item.subtotal,
            "descuento": item.descuento,
            "iva": item.iva,
            "retencion_isr": item.retencion_isr,
            "retencion_iva": item.retencion_iva,
            "total": item.total,
            "es_interes": item.es_interes,
            "parsed_data": item.parsed_data
        })

    # 3. Declaraciones Anuales SAT
    for item in db.query(DeclaracionAnualSAT).all():
        data["declaraciones_anuales_sat"].append({
            "id": item.id,
            "client_id": item.client_id,
            "rfc": item.rfc,
            "year": item.year,
            "tipo_declaracion": item.tipo_declaracion,
            "num_operacion": item.num_operacion,
            "fecha_presentacion": item.fecha_presentacion,
            "ingresos_acumulables": item.ingresos_acumulables,
            "deducciones_personales": item.deducciones_personales,
            "base_gravable": item.base_gravable,
            "isr_tarifa": item.isr_tarifa,
            "pagos_provisionales_acreditados": item.pagos_provisionales_acreditados,
            "isr_retenido": item.isr_retenido,
            "saldo_a_favor": item.saldo_a_favor,
            "saldo_a_cargo": item.saldo_a_cargo,
            "parcialidades": item.parcialidades,
            "destino_saldo": item.destino_saldo,
            "clabe": item.clabe,
            "banco": item.banco,
            "raw_pdf_path": item.raw_pdf_path,
            "parsed_json": item.parsed_json
        })

    # 4. Pagos Provisionales SAT
    for item in db.query(PagoProvisionalSAT).all():
        data["pagos_provisionales_sat"].append({
            "id": item.id,
            "client_id": item.client_id,
            "rfc": item.rfc,
            "year": item.year,
            "mes_numero": item.mes_numero,
            "mes_nombre": item.mes_nombre,
            "tipo_declaracion": item.tipo_declaracion,
            "num_operacion": item.num_operacion,
            "fecha_presentacion": item.fecha_presentacion,
            "isr_ingresos_periodo": item.isr_ingresos_periodo,
            "isr_ingresos_acumulados": item.isr_ingresos_acumulados,
            "isr_deducciones_autorizadas": item.isr_deducciones_autorizadas,
            "isr_base_gravable": item.isr_base_gravable,
            "isr_causado": item.isr_causado,
            "isr_retenido_periodo": item.isr_retenido_periodo,
            "isr_a_cargo": item.isr_a_cargo,
            "iva_base_gravada_16": item.iva_base_gravada_16,
            "iva_cobrado_16": item.iva_cobrado_16,
            "iva_acreditable_gastos": item.iva_acreditable_gastos,
            "iva_retenido": item.iva_retenido,
            "iva_a_cargo": item.iva_a_cargo,
            "total_pagado": item.total_pagado,
            "tiene_acuse_pago": item.tiene_acuse_pago,
            "total_pagado_acuse": item.total_pagado_acuse,
            "raw_pdf_path": item.raw_pdf_path,
            "raw_acuse_path": item.raw_acuse_path,
            "parsed_json": item.parsed_json
        })

    # 5. Acuses de Pago SAT
    for item in db.query(AcusePagoSAT).all():
        data["acuses_pagos_sat"].append({
            "id": item.id,
            "client_id": item.client_id,
            "rfc": item.rfc,
            "year": item.year,
            "mes_numero": item.mes_numero,
            "num_operacion": item.num_operacion,
            "fecha_presentacion": item.fecha_presentacion,
            "monto_isr_pagado": item.monto_isr_pagado,
            "monto_iva_pagado": item.monto_iva_pagado,
            "total_pagado": item.total_pagado,
            "raw_pdf_path": item.raw_pdf_path
        })

    # 6. Exclusiones y Constancias
    for item in db.query(CfdiExclusion).all():
        data["cfdi_exclusions"].append({
            "client_id": item.client_id,
            "uuid": item.uuid,
            "motivo": item.motivo,
            "tipo": item.tipo
        })

    for item in db.query(ConstanciaFiscalExterna).all():
        data["constancias_fiscales_externas"].append({
            "id": item.id,
            "client_id": item.client_id,
            "year": item.year,
            "uso_cfdi": item.uso_cfdi,
            "emisor_rfc": item.emisor_rfc,
            "emisor_nombre": item.emisor_nombre,
            "fecha": item.fecha,
            "monto": item.monto,
            "descripcion": item.descripcion
        })

    # 7. Parámetros SAT y Tarifas
    for item in db.query(ParametroSat).all():
        data["parametros_sat"].append({
            "year": item.year,
            "uma_diaria": item.uma_diaria,
            "uma_mensual": item.uma_mensual,
            "uma_anual": item.uma_anual,
            "uma_5_anual": item.uma_5_anual,
            "tope_deducciones_pct": item.tope_deducciones_pct,
            "salario_minimo": item.salario_minimo
        })

    for item in db.query(TarifaIsrAnual).all():
        data["tarifas_isr_anuales"].append({
            "year": item.year,
            "limite_inferior": item.limite_inferior,
            "limite_superior": item.limite_superior,
            "cuota_fija": item.cuota_fija,
            "porcentaje_excedente": item.porcentaje_excedente,
            "orden": item.orden
        })

    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    with gzip.open(target, "wt", encoding="utf-8") as f:
        f.write(json_str)

    return target


def import_demo_fixture(db: Session, fixture_path: Optional[Path] = None) -> Dict[str, int]:
    """
    Carga el dataset de prueba fixture .json.gz o .json en la base de datos.
    """
    target = fixture_path or DEFAULT_FIXTURE_PATH
    if not target.exists():
        raise FileNotFoundError(f"Fixture no encontrado en: {target}")

    if str(target).endswith(".gz"):
        with gzip.open(target, "rt", encoding="utf-8") as f:
            data = json.load(f)
    else:
        with open(target, "r", encoding="utf-8") as f:
            data = json.load(f)

    stats = {}

    # 1. Clientes
    for c_data in data.get("clients", []):
        c = db.query(Client).filter(Client.id == c_data["id"]).first()
        if not c:
            db.add(Client(**c_data))
    db.commit()
    stats["clients"] = len(data.get("clients", []))

    # 2. Exclusiones y Constancias
    for e_data in data.get("cfdi_exclusions", []):
        exists = db.query(CfdiExclusion).filter(
            CfdiExclusion.client_id == e_data["client_id"],
            CfdiExclusion.uuid == e_data["uuid"]
        ).first()
        if not exists:
            db.add(CfdiExclusion(**e_data))

    for c_data in data.get("constancias_fiscales_externas", []):
        exists = db.query(ConstanciaFiscalExterna).filter(
            ConstanciaFiscalExterna.client_id == c_data["client_id"],
            ConstanciaFiscalExterna.id == c_data["id"]
        ).first()
        if not exists:
            db.add(ConstanciaFiscalExterna(**c_data))
    db.commit()

    # 3. Parámetros SAT y Tarifas
    for p in data.get("parametros_sat", []):
        exists = db.query(ParametroSat).filter(ParametroSat.year == p["year"]).first()
        if not exists:
            db.add(ParametroSat(**p))

    for t in data.get("tarifas_isr_anuales", []):
        exists = db.query(TarifaIsrAnual).filter(
            TarifaIsrAnual.year == t["year"],
            TarifaIsrAnual.orden == t["orden"]
        ).first()
        if not exists:
            db.add(TarifaIsrAnual(**t))
    db.commit()

    # 4. CFDIs (en bloques para eficiencia)
    cfdis_added = 0
    for cfdi_data in data.get("cfdis", []):
        exists = db.query(Cfdi).filter(
            Cfdi.client_id == cfdi_data["client_id"],
            Cfdi.id == cfdi_data["id"]
        ).first()
        if not exists:
            db.add(Cfdi(**cfdi_data))
            cfdis_added += 1
            if cfdis_added % 500 == 0:
                db.commit()
    db.commit()
    stats["cfdis"] = cfdis_added

    # 5. Declaraciones Anuales SAT
    anuales_added = 0
    for a in data.get("declaraciones_anuales_sat", []):
        exists = db.query(DeclaracionAnualSAT).filter(DeclaracionAnualSAT.id == a["id"]).first()
        if not exists:
            db.add(DeclaracionAnualSAT(**a))
            anuales_added += 1
    db.commit()
    stats["declaraciones_anuales"] = anuales_added

    # 6. Pagos Provisionales SAT
    prov_added = 0
    for p in data.get("pagos_provisionales_sat", []):
        exists = db.query(PagoProvisionalSAT).filter(PagoProvisionalSAT.id == p["id"]).first()
        if not exists:
            db.add(PagoProvisionalSAT(**p))
            prov_added += 1
    db.commit()
    stats["pagos_provisionales"] = prov_added

    # 7. Acuses de Pago SAT
    acuses_added = 0
    for ac in data.get("acuses_pagos_sat", []):
        exists = db.query(AcusePagoSAT).filter(AcusePagoSAT.id == ac["id"]).first()
        if not exists:
            db.add(AcusePagoSAT(**ac))
            acuses_added += 1
    db.commit()
    stats["acuses_pagos"] = acuses_added

    return stats


def cargar_data_prueba_completa(db: Session, force_fixture: bool = False) -> Dict[str, Any]:
    """
    Orquesta la carga completa de datos de prueba:
    1. Si force_fixture es True o no hay archivos locales, carga desde demo_dataset.json.gz.
    2. Si existen carpetas locales, sincroniza XMLs y PDFs oficiales.
    3. Pre-calcula y guarda la caché de resúmenes fiscales 2022-2026.
    """
    client = ensure_default_client(db)

    res_scan = {"scanned": 0, "ingested": 0}
    res_sat = {"anuales": 0, "provisionales": 0, "acuses": 0}
    fixture_stats = {}

    if not force_fixture:
        res_scan = scan_local_paths(client, db)
        res_sat = sync_all_sat_documents_to_db(db, client)

    cfdi_count = db.query(Cfdi).filter(Cfdi.client_id == client.id).count()

    if (force_fixture or cfdi_count < 100) and DEFAULT_FIXTURE_PATH.exists():
        fixture_stats = import_demo_fixture(db, DEFAULT_FIXTURE_PATH)
        cfdi_count = db.query(Cfdi).filter(Cfdi.client_id == client.id).count()

    # Precalcular resúmenes fiscales para respuesta ultra-rápida en UI
    for year in ["2022", "2023", "2024", "2025", "2026"]:
        invalidate_client_cache(client.id, db, year)
        build_fiscal_summary(client, year, db, use_cache=False)

    return {
        "client_id": client.id,
        "client_rfc": client.rfc,
        "total_cfdis": cfdi_count,
        "scanned_local": res_scan,
        "sat_documents": res_sat,
        "fixture_loaded": fixture_stats
    }
