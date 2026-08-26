"""
Router de FastAPI para CFDIs, Ingesta, Parámetros SAT, Exclusiones y Resumen Fiscal.
"""

import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Client, Cfdi, CfdiExclusion, ConstanciaFiscalExterna,
    TarifaIsrAnual, ParametroSat
)
from app.cfdis.engine import build_fiscal_summary
from app.cfdis.schemas import ClientCreate, SyncResponse, UploadResponse, CacheClearResponse
from app.cfdis.storage import (
    ensure_default_client,
    scan_local_paths,
    process_uploaded_files,
    invalidate_client_cache
)

router = APIRouter(prefix="/api", tags=["CFDIs & Fiscal"])


@router.get("/clients")
def list_clients(db: Session = Depends(get_db)):
    """Lista todos los contribuyentes registrados en la base de datos."""
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


@router.post("/clients", status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    """Registra un nuevo contribuyente para análisis fiscal."""
    existing = db.query(Client).filter(
        (Client.id == payload.id) | (Client.rfc == payload.rfc.upper())
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID o RFC ya se encuentra registrado."
        )

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
    year: Optional[str] = Query(None, description="Ejercicio fiscal a calcular"),
    client_id: Optional[str] = Query(None, description="ID del cliente/contribuyente"),
    force_refresh: bool = Query(False, description="Forzar re-cálculo e invalidar caché"),
    db: Session = Depends(get_db)
):
    """
    Retorna la radiografía fiscal del cliente y ejercicio fiscal seleccionado.
    """
    target_year = year or str(datetime.now().year)

    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    else:
        client = ensure_default_client(db)

    # Si el cliente no tiene CFDIs en DB pero tiene rutas locales, auto-escanea al primer request
    has_cfdis = db.query(Cfdi).filter(Cfdi.client_id == client.id).first()
    if not has_cfdis:
        scan_local_paths(client, db)

    if force_refresh:
        invalidate_client_cache(client.id, db, target_year)

    return build_fiscal_summary(client, target_year, db, use_cache=not force_refresh)


@router.post("/upload")
def upload_cfdis(
    files: List[UploadFile] = File(..., description="Archivos XML o ZIP de CFDIs"),
    client_id: Optional[str] = Query(None, description="ID del cliente"),
    db: Session = Depends(get_db)
):
    """
    Sube archivos .xml o .zip de CFDIs y los procesa en la base de datos del cliente.
    """
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
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
    client_id: Optional[str] = Query(None, description="ID del cliente"),
    db: Session = Depends(get_db)
):
    """
    Re-escanea las carpetas locales del cliente para detectar XMLs nuevos.
    """
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
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
    filename: str = Query(..., description="Nombre del archivo XML"),
    client_id: Optional[str] = Query(None, description="ID del cliente"),
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

    from app.config import DEFAULT_EMITIDOS_DIR, DEFAULT_RECIBIDOS_DIR, DATA_DIR
    for directory in [DEFAULT_EMITIDOS_DIR, DEFAULT_RECIBIDOS_DIR, DATA_DIR]:
        if directory and os.path.exists(directory):
            for root, _, files in os.walk(directory):
                if filename in files:
                    file_path = os.path.join(root, filename)
                    return FileResponse(file_path, media_type='application/xml', filename=filename)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo XML no original encontrado")


@router.delete("/cache")
def clear_cache(
    year: Optional[str] = Query(None, description="Ejercicio fiscal específico o todos"),
    client_id: Optional[str] = Query(None, description="ID del cliente"),
    db: Session = Depends(get_db)
):
    """Limpia la caché de cálculos fiscales en memoria y base de datos."""
    if client_id:
        client = db.query(Client).filter(Client.id == client_id).first()
    else:
        client = ensure_default_client(db)

    if client:
        invalidate_client_cache(client.id, db, year)
    return {"status": "cache_cleared", "year": year or "all"}


# ─── GESTIÓN DE EXCLUSIONES Y CONSTANCIAS POR CLIENTE ───

@router.get("/clients/{client_id}/exclusions")
def list_client_exclusions(client_id: str, db: Session = Depends(get_db)):
    """Lista los UUIDs y reglas de exclusión configuradas para el cliente."""
    return db.query(CfdiExclusion).filter(CfdiExclusion.client_id == client_id).all()


@router.post("/clients/{client_id}/exclusions", status_code=status.HTTP_201_CREATED)
def add_client_exclusion(
    client_id: str,
    uuid: str,
    motivo: Optional[str] = None,
    tipo: str = "ignorar",
    db: Session = Depends(get_db)
):
    """Registra una exclusión o regla personalizada de CFDI para un cliente."""
    existing = db.query(CfdiExclusion).filter(
        CfdiExclusion.client_id == client_id,
        CfdiExclusion.uuid == uuid
    ).first()
    if existing:
        existing.motivo = motivo
        existing.tipo = tipo
        db.commit()
        invalidate_client_cache(client_id, db)
        return existing

    item = CfdiExclusion(client_id=client_id, uuid=uuid, motivo=motivo, tipo=tipo)
    db.add(item)
    db.commit()
    db.refresh(item)
    invalidate_client_cache(client_id, db)
    return item


@router.delete("/clients/{client_id}/exclusions/{exclusion_id}")
def delete_client_exclusion(client_id: str, exclusion_id: int, db: Session = Depends(get_db)):
    """Elimina una exclusión de CFDI para un cliente."""
    item = db.query(CfdiExclusion).filter(
        CfdiExclusion.id == exclusion_id,
        CfdiExclusion.client_id == client_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Exclusión no encontrada")
    db.delete(item)
    db.commit()
    invalidate_client_cache(client_id, db)
    return {"status": "deleted", "id": exclusion_id}


@router.get("/clients/{client_id}/constancias")
def list_client_constancias(
    client_id: str,
    year: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista las constancias fiscales externas registradas para un cliente."""
    q = db.query(ConstanciaFiscalExterna).filter(ConstanciaFiscalExterna.client_id == client_id)
    if year:
        q = q.filter(ConstanciaFiscalExterna.year == year)
    return q.all()


@router.post("/clients/{client_id}/constancias", status_code=status.HTTP_201_CREATED)
def add_client_constancia(
    client_id: str,
    id: str,
    year: str,
    monto: float,
    uso_cfdi: str = "D06",
    emisor_rfc: Optional[str] = None,
    emisor_nombre: Optional[str] = None,
    descripcion: Optional[str] = None,
    fecha: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Registra una constancia física o comprobante deducible externo para el cliente."""
    existing = db.query(ConstanciaFiscalExterna).filter(
        ConstanciaFiscalExterna.client_id == client_id,
        ConstanciaFiscalExterna.id == id
    ).first()
    if existing:
        existing.monto = monto
        existing.uso_cfdi = uso_cfdi
        existing.emisor_rfc = emisor_rfc
        existing.emisor_nombre = emisor_nombre
        existing.descripcion = descripcion
        existing.fecha = fecha
        db.commit()
        invalidate_client_cache(client_id, db, year)
        return existing

    item = ConstanciaFiscalExterna(
        id=id,
        client_id=client_id,
        year=year,
        uso_cfdi=uso_cfdi,
        emisor_rfc=emisor_rfc,
        emisor_nombre=emisor_nombre,
        monto=monto,
        descripcion=descripcion,
        fecha=fecha or f"{year}-12-31"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    invalidate_client_cache(client_id, db, year)
    return item


# ─── PARÁMETROS FISCALES Y TARIFAS SAT ───

@router.get("/sat/tarifas/{year}")
def get_sat_tarifa_anual(year: str, db: Session = Depends(get_db)):
    """Obtiene la tarifa progresiva anual del Art. 152 LISR para el ejercicio solicitado."""
    rows = db.query(TarifaIsrAnual).filter(TarifaIsrAnual.year == year).order_by(TarifaIsrAnual.orden).all()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No hay tarifa configurada para el ejercicio {year}")
    return [
        {
            "orden": r.orden,
            "limite_inferior": r.limite_inferior,
            "limite_superior": r.limite_superior if r.limite_superior < 999999999 else None,
            "cuota_fija": r.cuota_fija,
            "porcentaje_excedente": r.porcentaje_excedente
        }
        for r in rows
    ]


@router.get("/sat/parametros")
def get_sat_parametros(db: Session = Depends(get_db)):
    """Obtiene los parámetros históricos y vigentes de UMAs del SAT."""
    return db.query(ParametroSat).all()
