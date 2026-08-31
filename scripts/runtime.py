"""Compatibilidad: `import runtime` desde scripts/ o el bundle PyInstaller."""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from tributacos_core.runtime import *  # noqa: F403
