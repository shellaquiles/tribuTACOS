"""
Esquemas Pydantic v2 para validación y serialización de la API de CFDIs y Fiscal.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ClientBase(BaseModel):
    id: str = Field(..., description="Identificador único o slug del cliente")
    name: str = Field(..., description="Nombre o Razón Social del contribuyente")
    rfc: str = Field(..., description="Registro Federal de Contribuyentes (12-13 caracteres)")
    email: Optional[str] = None
    local_path_emitidos: Optional[str] = None
    local_path_recibidos: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    plan: str = "basic"
    cfdis_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class CfdiItemConcepto(BaseModel):
    clave: Optional[str] = None
    desc: Optional[str] = None
    imp: float = 0.0
    subtotal_partida: Optional[float] = None
    iva_partida: Optional[float] = None
    total_partida: Optional[float] = None
    categoria_gasto: Optional[Dict[str, Any]] = None


class SyncResponse(BaseModel):
    status: str
    client_id: str
    scanned: int
    ingested: int


class UploadResultResponse(BaseModel):
    files_total: int
    files_ok: int
    files_error: int


class UploadResponse(BaseModel):
    status: str
    client_id: str
    result: UploadResultResponse


class CacheClearResponse(BaseModel):
    status: str
    year: str
