"""Asegura rutas de importacion del proyecto (core compartido + runner CLI)."""

from __future__ import annotations

import sys
from pathlib import Path

INFRA_DIR = Path(__file__).resolve().parent
CONTROL_PANEL_ROOT = INFRA_DIR.parent
PROJECT_ROOT = CONTROL_PANEL_ROOT.parent
CORE_DIR = PROJECT_ROOT / "tributacos_core"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
RUNNER = SCRIPTS_DIR / "tributacos.py"


def ensure_import_paths() -> Path:
    """Anade la raiz del repo (tributacos_core) y scripts/ a sys.path."""
    for path in (PROJECT_ROOT, SCRIPTS_DIR):
        if str(path) not in sys.path:
            sys.path.insert(0, str(path))
    return SCRIPTS_DIR


def ensure_scripts_path() -> Path:
    """Alias legacy usado por modulos que solo necesitaban scripts/."""
    return ensure_import_paths()
