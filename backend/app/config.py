"""
Centralized Configuration Module for tribuTACOS.
Supports environment variables and .env file loading via standard pathlib and os.
"""

import os
import sys
from pathlib import Path
from typing import List


def _is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"))


def _bundled_root() -> Path:
    if _is_frozen():
        return Path(sys._MEIPASS)  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent.parent.parent


APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = Path(sys._MEIPASS) if _is_frozen() else APP_DIR.parent  # type: ignore[attr-defined]
PROJECT_ROOT = _bundled_root()

try:
    from dotenv import load_dotenv
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists() and not _is_frozen():
        env_path = BACKEND_DIR / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


def _read_version() -> str:
    candidates = [
        PROJECT_ROOT / "VERSION",
        BACKEND_DIR.parent / "VERSION",
        BACKEND_DIR / "VERSION",
        APP_DIR / "VERSION",
    ]
    for path in candidates:
        try:
            if path.is_file():
                value = path.read_text(encoding="utf-8").strip()
                if value:
                    return value
        except OSError:
            continue
    return os.getenv("TRIBUTACOS_VERSION", "0.0.0")


VERSION = _read_version()


def _default_user_data_dir() -> Path:
    if sys.platform == "win32":
        base = Path(os.getenv("APPDATA", Path.home() / "AppData" / "Roaming"))
        return (base / "tributacos").resolve()
    if sys.platform == "darwin":
        return (Path.home() / "Library" / "Application Support" / "tributacos").resolve()
    return (Path.home() / ".local" / "share" / "tributacos").resolve()


_use_user_data = _is_frozen() or (
    ENVIRONMENT == "production" and not os.getenv("DATA_DIR")
)

if _use_user_data:
    USER_DATA_DIR = Path(os.getenv("USER_DATA_DIR", _default_user_data_dir())).resolve()
else:
    USER_DATA_DIR = Path(os.getenv("DATA_DIR", BACKEND_DIR / "data")).resolve()

USER_DATA_DIR.mkdir(parents=True, exist_ok=True)

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8010"))
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS: List[str] = (
    [orig.strip() for orig in CORS_ORIGINS_RAW.split(",")] if CORS_ORIGINS_RAW != "*" else ["*"]
)

if os.getenv("DATABASE_URL"):
    DATABASE_URL = os.getenv("DATABASE_URL", "")
elif _use_user_data:
    db_path = USER_DATA_DIR / "tributacos.db"
    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"
else:
    _default_db_path = BACKEND_DIR / "tributacos.db"
    DATABASE_URL = f"sqlite:///{_default_db_path.as_posix()}"

AUTH_ENABLED = os.getenv("AUTH_ENABLED", "false").lower() in ("true", "1", "yes")
SECRET_KEY = os.getenv("SECRET_KEY", "tributacos-super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def _resolve_dir(env_var: str, default_rel: Path) -> Path:
    val = os.getenv(env_var)
    if val:
        p = Path(val)
        return p if p.is_absolute() else (PROJECT_ROOT / p).resolve()
    return default_rel.resolve()


if os.getenv("DATA_DIR"):
    DATA_DIR = _resolve_dir("DATA_DIR", USER_DATA_DIR)
elif _use_user_data:
    DATA_DIR = USER_DATA_DIR / "data"
else:
    DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

if _use_user_data and not os.getenv("CFDI_EMITIDOS_DIR"):
    DEFAULT_EMITIDOS_DIR = (USER_DATA_DIR / "cfdi_emitidos").resolve()
else:
    DEFAULT_EMITIDOS_DIR = _resolve_dir("CFDI_EMITIDOS_DIR", PROJECT_ROOT / "cfdi_emitidos")

if _use_user_data and not os.getenv("CFDI_RECIBIDOS_DIR"):
    DEFAULT_RECIBIDOS_DIR = (USER_DATA_DIR / "cfdi_recibidos").resolve()
else:
    DEFAULT_RECIBIDOS_DIR = _resolve_dir("CFDI_RECIBIDOS_DIR", PROJECT_ROOT / "cfdi_recibidos")

if _use_user_data and not os.getenv("DESCARGADOS_DIR"):
    DESCARGADOS_DIR = (USER_DATA_DIR / "descargados").resolve()
else:
    DESCARGADOS_DIR = _resolve_dir("DESCARGADOS_DIR", PROJECT_ROOT / "descargados")

for _d in (DEFAULT_EMITIDOS_DIR, DEFAULT_RECIBIDOS_DIR, DESCARGADOS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

DEFAULT_CLIENT_RFC = os.getenv("DEFAULT_CLIENT_RFC", "SHLL250825XYZ")
DEFAULT_CLIENT_NAME = os.getenv("DEFAULT_CLIENT_NAME", "Sheila Shellaquiles Ortega")
DEFAULT_CLIENT_EMAIL = os.getenv("DEFAULT_CLIENT_EMAIL", "tributacos@shellaquiles.org")
