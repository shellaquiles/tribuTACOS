from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, AUTH_ENABLED
from app.database import get_db
from app.models import Client

# bcrypt opera sobre un máximo de 72 bytes; recortamos de forma explícita para
# evitar errores con contraseñas largas (comportamiento equivalente al clásico).
_BCRYPT_MAX_BYTES = 72


def _to_bcrypt_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(_to_bcrypt_bytes(plain_password), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_to_bcrypt_bytes(password), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_client(
    authorization: Optional[str] = Header(None),
    client_id: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Client:
    """
    Retorna el cliente actual.
    Si AUTH_ENABLED=false (v1), retorna el cliente seleccionado por client_id o el default.
    Si AUTH_ENABLED=true (v2), valida el JWT Bearer token.
    """
    from app.cfdis.storage import ensure_default_client
    
    if not AUTH_ENABLED:
        if client_id:
            client = db.query(Client).filter(Client.id == client_id).first()
            if client:
                return client
        return ensure_default_client(db)

    # v2 Token enforcement
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales no proporcionadas o inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        cid: str = payload.get("sub")
        if cid is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado o inválido")

    client = db.query(Client).filter(Client.id == cid).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return client
