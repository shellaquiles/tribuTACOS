"""Utilidades compartidas para el .exe congelado (PyInstaller, console=False)."""

from __future__ import annotations

import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import TextIO


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def user_data_dir() -> Path:
    override = os.getenv("DATA_DIR")
    if override:
        return Path(override).expanduser().resolve()
    if sys.platform == "win32":
        base = Path(os.getenv("APPDATA", Path.home() / "AppData" / "Roaming"))
        return (base / "tributacos").resolve()
    if sys.platform == "darwin":
        return (Path.home() / "Library" / "Application Support" / "tributacos").resolve()
    return (Path.home() / ".local" / "share" / "tributacos").resolve()


def log_file_path() -> Path:
    folder = user_data_dir() / "logs"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / "tributacos.log"


class _FrozenLogStream:
    """Redirige print/logging a archivo cuando no hay consola (console=False)."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._file: TextIO | None = None

    def _ensure(self) -> TextIO:
        if self._file is None:
            self._file = self._path.open("a", encoding="utf-8", buffering=1)
        return self._file

    def write(self, data: str) -> int:
        if not data:
            return 0
        fh = self._ensure()
        stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for line in data.splitlines(keepends=True):
            if line.endswith("\n"):
                fh.write(f"{stamp}  {line}")
            else:
                fh.write(line)
        fh.flush()
        return len(data)

    def flush(self) -> None:
        if self._file is not None:
            self._file.flush()

    def isatty(self) -> bool:
        return False


def prepare_frozen_runtime() -> Path | None:
    """
    En el .exe: fija ENVIRONMENT, stdio y logging basico antes de uvicorn/FastAPI.
    Devuelve la ruta del log o None en desarrollo.
    """
    if not is_frozen():
        return None

    os.environ.setdefault("ENVIRONMENT", "production")
    log_path = log_file_path()
    stream = _FrozenLogStream(log_path)

    if sys.stdout is None:
        sys.stdout = stream  # type: ignore[assignment]
    if sys.stderr is None:
        sys.stderr = stream  # type: ignore[assignment]

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)s  %(name)s  %(message)s",
        handlers=[logging.FileHandler(log_path, encoding="utf-8")],
        force=True,
    )
    logging.getLogger(__name__).info("Arranque congelado tribuTACOS")
    return log_path


def uvicorn_log_config() -> dict:
    """Evita DefaultFormatter con use_colors=None (isatty sobre stdout=None)."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "uvicorn.logging.DefaultFormatter",
                "fmt": "%(levelprefix)s %(message)s",
                "use_colors": False,
            },
            "access": {
                "()": "uvicorn.logging.AccessFormatter",
                "fmt": '%(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',
                "use_colors": False,
            },
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stderr",
            },
            "access": {
                "class": "logging.StreamHandler",
                "formatter": "access",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
            "uvicorn.error": {"level": "INFO"},
            "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
        },
    }
