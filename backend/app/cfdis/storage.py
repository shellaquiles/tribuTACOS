import os
import json
import zipfile
import shutil
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.config import DATA_DIR, LEGACY_EMITIDOS, LEGACY_RECIBIDOS
from app.models import Client, Cfdi, UploadBatch, SummaryCache
from app.cfdis.parser import parse_cfdi

def ensure_default_client(db: Session) -> Client:
    """Crea o retorna el cliente por defecto para uso inmediato con los datos existentes."""
    client = db.query(Client).filter(Client.id == "default").first()
    if not client:
        # Check if there is a known RFC in existing files or fallback
        client = Client(
            id="default",
            name="Contribuyente Principal",
            rfc="GAQA810905BCA",
            email="contacto@tributacos.mx",
            plan="pro",
            local_path_emitidos=str(LEGACY_EMITIDOS) if LEGACY_EMITIDOS.exists() else None,
            local_path_recibidos=str(LEGACY_RECIBIDOS) if LEGACY_RECIBIDOS.exists() else None,
        )
        db.add(client)
        db.commit()
        db.refresh(client)
    return client

def invalidate_client_cache(client_id: str, db: Session, year: Optional[str] = None):
    query = db.query(SummaryCache).filter(SummaryCache.client_id == client_id)
    if year:
        query = query.filter(SummaryCache.year == year)
    query.delete()
    db.commit()

def ingest_xml_path(client_id: str, filepath: str, user_rfc: str, db: Session) -> Optional[Cfdi]:
    parsed = parse_cfdi(filepath, user_rfc=user_rfc)
    if not parsed or not parsed.get('uuid'):
        return None

    uuid = parsed['uuid']
    existing = db.query(Cfdi).filter(Cfdi.client_id == client_id, Cfdi.id == uuid).first()
    
    fecha = parsed.get('fecha') or ''
    year = fecha[:4] if len(fecha) >= 4 else 'unknown'

    if not existing:
        cfdi_obj = Cfdi(
            id=uuid,
            client_id=client_id,
            filename=os.path.basename(filepath),
            filepath=filepath,
            categoria=parsed.get('categoria'),
            tipo=parsed.get('tipo'),
            fecha=fecha,
            year=year,
            emisor_rfc=parsed.get('emisor_rfc'),
            emisor_nombre=parsed.get('emisor_nombre'),
            receptor_rfc=parsed.get('receptor_rfc'),
            receptor_nombre=parsed.get('receptor_nombre'),
            uso_cfdi=parsed.get('uso_cfdi'),
            metodo_pago=parsed.get('metodo_pago'),
            forma_pago=parsed.get('forma_pago'),
            subtotal=parsed.get('subtotal', 0.0),
            descuento=parsed.get('descuento', 0.0),
            iva=parsed.get('iva', 0.0),
            retencion_isr=parsed.get('retencion_isr', 0.0),
            retencion_iva=parsed.get('retencion_iva', 0.0),
            total=parsed.get('total', 0.0),
            es_interes=parsed.get('es_interes', False),
            parsed_data=json.dumps(parsed, ensure_ascii=False),
        )
        db.add(cfdi_obj)
        return cfdi_obj
    else:
        # Update existing record if needed
        existing.filepath = filepath
        existing.filename = os.path.basename(filepath)
        existing.categoria = parsed.get('categoria')
        existing.parsed_data = json.dumps(parsed, ensure_ascii=False)
        return existing

def scan_local_paths(client: Client, db: Session) -> Dict[str, int]:
    """Escanea las rutas locales configuradas del cliente e ingesta los XMLs nuevos."""
    paths_to_scan = []
    if client.local_path_emitidos and os.path.exists(client.local_path_emitidos):
        paths_to_scan.append(client.local_path_emitidos)
    if client.local_path_recibidos and os.path.exists(client.local_path_recibidos):
        paths_to_scan.append(client.local_path_recibidos)

    client_dir = DATA_DIR / client.id
    if client_dir.exists():
        paths_to_scan.append(str(client_dir))

    total_scanned = 0
    total_added = 0

    for base_dir in paths_to_scan:
        for root, _, files in os.walk(base_dir):
            for f in files:
                if f.lower().endswith('.xml'):
                    total_scanned += 1
                    fp = os.path.join(root, f)
                    obj = ingest_xml_path(client.id, fp, client.rfc, db)
                    if obj:
                        total_added += 1

    db.commit()
    return {"scanned": total_scanned, "ingested": total_added}

def process_uploaded_files(client: Client, upload_files: List[UploadFile], db: Session) -> Dict:
    """Procesa archivos subidos (.xml o .zip) guardándolos en el storage del cliente."""
    client_dir = DATA_DIR / client.id
    emitidos_dir = client_dir / "cfdi_emitidos"
    recibidos_dir = client_dir / "cfdi_recibidos"
    emitidos_dir.mkdir(parents=True, exist_ok=True)
    recibidos_dir.mkdir(parents=True, exist_ok=True)

    temp_dir = client_dir / f"tmp_{datetime.utcnow().timestamp()}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    total_files = 0
    ok_files = 0
    error_files = 0

    try:
        extracted_xmls = []
        for uf in upload_files:
            fn = uf.filename or "file"
            dest = temp_dir / fn
            with open(dest, "wb") as buffer:
                shutil.copyfileobj(uf.file, buffer)

            if fn.lower().endswith(".zip"):
                try:
                    with zipfile.ZipFile(dest, "r") as zip_ref:
                        for zip_info in zip_ref.infolist():
                            if zip_info.filename.lower().endswith(".xml") and not zip_info.is_dir():
                                zip_info.filename = os.path.basename(zip_info.filename)
                                zip_ref.extract(zip_info, temp_dir)
                                extracted_xmls.append(temp_dir / zip_info.filename)
                except Exception:
                    error_files += 1
            elif fn.lower().endswith(".xml"):
                extracted_xmls.append(dest)

        total_files = len(extracted_xmls)
        for xml_p in extracted_xmls:
            try:
                parsed = parse_cfdi(str(xml_p), user_rfc=client.rfc)
                if not parsed or not parsed.get('uuid'):
                    error_files += 1
                    continue

                # Auto classify storage folder
                cat = parsed.get('categoria', 'egreso')
                target_folder = emitidos_dir if cat == 'ingreso' or parsed.get('emisor_rfc', '').upper() == client.rfc.upper() else recibidos_dir
                
                final_dest = target_folder / xml_p.name
                shutil.copy2(xml_p, final_dest)

                obj = ingest_xml_path(client.id, str(final_dest), client.rfc, db)
                if obj:
                    ok_files += 1
                else:
                    error_files += 1
            except Exception:
                error_files += 1

        db.commit()
        invalidate_client_cache(client.id, db)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    return {
        "files_total": total_files,
        "files_ok": ok_files,
        "files_error": error_files
    }
