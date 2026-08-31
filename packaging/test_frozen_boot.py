#!/usr/bin/env python3
"""Simula arranque congelado (sin PyInstaller) para detectar fallos de import/logging."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / "packaging"), str(ROOT / "backend")]
os.environ.setdefault("ENVIRONMENT", "production")
os.environ.setdefault("SERVE_STATIC", "0")

# Emula PyInstaller console=False
sys.frozen = True  # type: ignore[attr-defined]
sys.stdout = None  # type: ignore[assignment]
sys.stderr = None  # type: ignore[assignment]

from frozen_bootstrap import prepare_frozen_runtime, uvicorn_log_config  # noqa: E402

prepare_frozen_runtime()
import logging.config  # noqa: E402

logging.config.dictConfig(uvicorn_log_config())

from app.main import app  # noqa: E402

assert app is not None
print("frozen boot smoke: OK")
