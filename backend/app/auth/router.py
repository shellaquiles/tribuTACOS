from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Client
from app.auth.service import create_access_token, get_current_client

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
    if not client:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="RFC no registrado en tributacos"
        )
    
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
