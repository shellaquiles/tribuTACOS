from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Client
from app.auth.service import create_access_token, get_current_client, verify_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class LoginRequest(BaseModel):
    rfc: str
    password: str = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    client: dict

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.rfc == req.rfc.upper()).first()
    # Mensaje genérico idéntico para RFC inexistente y contraseña incorrecta:
    # evita revelar qué RFCs están registrados (user enumeration).
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="RFC o contraseña incorrectos",
    )
    if not client:
        raise invalid_credentials

    # La contraseña DEBE verificarse antes de emitir el token. Sin esta
    # comprobación, cualquiera que conozca un RFC obtenía una sesión válida.
    if not client.password_hash or not verify_password(req.password, client.password_hash):
        raise invalid_credentials

    token = create_access_token(data={"sub": client.id, "rfc": client.rfc})
    return {
        "access_token": token,
        "token_type": "bearer",
        "client": {
            "id": client.id,
            "name": client.name,
            "rfc": client.rfc,
            "email": client.email,
            "plan": client.plan
        }
    }

@router.get("/me")
def get_me(current_client: Client = Depends(get_current_client)):
    return {
        "id": current_client.id,
        "name": current_client.name,
        "rfc": current_client.rfc,
        "email": current_client.email,
        "plan": current_client.plan,
        "created_at": current_client.created_at
    }
