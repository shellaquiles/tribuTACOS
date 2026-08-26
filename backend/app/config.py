"""
Centralized Configuration Module for tribuTACOS.
Supports environment variables and .env file loading via standard pathlib and os.
"""

import os
from pathlib import Path
from typing import List

# Determine base paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Attempt to load .env file from project root or backend dir
try:
    from dotenv import load_dotenv
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        env_path = BACKEND_DIR / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8010"))
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS: List[str] = [orig.strip() for orig in CORS_ORIGINS_RAW.split(",")] if CORS_ORIGINS_RAW != "*" else ["*"]

# Database settings
_default_db_path = BACKEND_DIR / "tributacos.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_default_db_path}")

# Authentication settings
AUTH_ENABLED = os.getenv("AUTH_ENABLED", "false").lower() in ("true", "1", "yes")
SECRET_KEY = os.getenv("SECRET_KEY", "tributacos-super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Storage and CFDI Directories
DATA_DIR = Path(os.getenv("DATA_DIR", BACKEND_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Standard CFDI paths (relative or configured via environment)
def _resolve_dir(env_var: str, default_rel: Path) -> Path:
    val = os.getenv(env_var)
    if val:
        p = Path(val)
        return p if p.is_absolute() else (PROJECT_ROOT / p).resolve()
    return default_rel.resolve()

DEFAULT_EMITIDOS_DIR = _resolve_dir("CFDI_EMITIDOS_DIR", PROJECT_ROOT / "cfdi_emitidos")
DEFAULT_RECIBIDOS_DIR = _resolve_dir("CFDI_RECIBIDOS_DIR", PROJECT_ROOT / "cfdi_recibidos")
DESCARGADOS_DIR = _resolve_dir("DESCARGADOS_DIR", PROJECT_ROOT / "descargados")

# Default Client / RFC settings for immediate zero-config operation
DEFAULT_CLIENT_RFC = os.getenv("DEFAULT_CLIENT_RFC", "SHLL250825XYZ")
DEFAULT_CLIENT_NAME = os.getenv("DEFAULT_CLIENT_NAME", "Sheila Shellaquiles Ortega")
DEFAULT_CLIENT_EMAIL = os.getenv("DEFAULT_CLIENT_EMAIL", "tributacos@shellaquiles.org")
