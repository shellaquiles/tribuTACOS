import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_PROJECT_DIR = BASE_DIR.parent

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/tributacos.db")

# Storage
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Legacy / Default local paths for out-of-the-box demo
LEGACY_EMITIDOS = ROOT_PROJECT_DIR / "cfdi_emitidos"
LEGACY_RECIBIDOS = ROOT_PROJECT_DIR / "cfdi_recibidos"

# Auth Settings
AUTH_ENABLED = os.getenv("AUTH_ENABLED", "false").lower() in ("true", "1", "yes")
SECRET_KEY = os.getenv("SECRET_KEY", "tributacos-secret-key-super-secure-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

