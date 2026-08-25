import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Client, Cfdi
from app.auth.service import get_current_client
from app.cfdis.engine import build_fiscal_summary
from app.cfdis.storage import (
    ensure_default_client,
    scan_local_paths,
    process_uploaded_files,
    invalidate_client_cache
)

router = APIRouter(prefix="/api", tags=["CFDIs & Fiscal"])

class ClientCreate(BaseModel):
    id: str
    name: str
    rfc: str
    email: Optional[str] = None
    local_path_emitidos: Optional[str] = None
    local_path_recibidos: Optional[str] = None

@router.get("/clients")
def list_clients(db: Session = Depends(get_db)):
    ensure_default_client(db)
    clients = db.query(Client).all()
    return [{
        "id": c.id,
        "name": c.name,
        "rfc": c.rfc,
        "email": c.email,
        "plan": c.plan,
        "cfdis_count": len(c.cfdis)
    } for c in clients]

@router.post("/clients")
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    existing = db.query(Client).filter((Client.id == payload.id) | (Client.rfc == payload.rfc.upper())).first()
    if existing:
        raise HTTPException(status_code=400, detail="El ID o RFC ya se encuentra registrado.")
    
    new_c = Client(
        id=payload.id,
        name=payload.name,
        rfc=payload.rfc.upper(),
        email=payload.email,
        local_path_emitidos=payload.local_path_emitidos,
        local_path_recibidos=payload.local_path_recibidos
    )
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return {"id": new_c.id, "name": new_c.name, "rfc": new_c.rfc}

@router.get("/summary")
def get_summary(
    year: str = "2024",
    client_id: Optional[str] = None,
    force_refresh: bool = False,
    db: Session = Depends(get_db)
):
    """
    Retorna la radiografía fiscal del cliente y ejercicio fiscal seleccionado.
    """
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    else:
        client = ensure_default_client(db)

    # Si el cliente no tiene CFDIs en DB pero tiene rutas locales, auto-escanea al primer request
    has_cfdis = db.query(Cfdi).filter(Cfdi.client_id == client.id).first()
    if not has_cfdis:
        scan_local_paths(client, db)

    if force_refresh:
        invalidate_client_cache(client.id, db, year)

    return build_fiscal_summary(client, year, db, use_cache=not force_refresh)

@router.post("/upload")
def upload_cfdis(
    files: List[UploadFile] = File(...),
    client_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Sube archivos .xml o .zip de CFDIs y los procesa en la base de datos del cliente.
    """
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    else:
        client = ensure_default_client(db)

    res = process_uploaded_files(client, files, db)
    return {
        "status": "success",
        "client_id": client.id,
        "result": res
    }

@router.post("/sync")
def sync_local_cfdis(
    client_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Re-escanea las carpetas locales del cliente para detectar XMLs nuevos.
    """
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
    else:
        client = ensure_default_client(db)

    res = scan_local_paths(client, db)
    invalidate_client_cache(client.id, db)
    return {
        "status": "success",
        "client_id": client.id,
        "scanned": res["scanned"],
        "ingested": res["ingested"]
    }

@router.get("/download_xml")
def download_xml(
    filename: str,
    client_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Descarga el archivo XML original guardado en disco.
    """
    query = db.query(Cfdi).filter(Cfdi.filename == filename)
    if client_id:
        query = query.filter(Cfdi.client_id == client_id)
    cfdi_obj = query.first()

    if cfdi_obj and cfdi_obj.filepath and os.path.exists(cfdi_obj.filepath):
        return FileResponse(cfdi_obj.filepath, media_type='application/xml', filename=filename)

    # Fallback to scanning legacy folders
    from app.config import LEGACY_EMITIDOS, LEGACY_RECIBIDOS, DATA_DIR
    for directory in [LEGACY_EMITIDOS, LEGACY_RECIBIDOS, DATA_DIR]:
        if directory and os.path.exists(directory):
            for root, _, files in os.walk(directory):
                if filename in files:
                    file_path = os.path.join(root, filename)
                    return FileResponse(file_path, media_type='application/xml', filename=filename)

    raise HTTPException(status_code=404, detail="Archivo XML no original encontrado")

@router.delete("/cache")
def clear_cache(
    year: Optional[str] = None,
    client_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
    else:
        client = ensure_default_client(db)
    
    if client:
        invalidate_client_cache(client.id, db, year)
    return {"status": "cache_cleared", "year": year or "all"}
