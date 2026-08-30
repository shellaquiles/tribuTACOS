"""Montaje de la interfaz web estatica cuando corre en modo standalone."""

from __future__ import annotations

import os
import sys
from pathlib import Path


def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"))


def should_serve_static() -> bool:
    if os.getenv("SERVE_STATIC", "").lower() in ("1", "true", "yes"):
        return True
    if is_frozen():
        return True
    return os.getenv("ENVIRONMENT", "development") == "production"


def resolve_static_dir() -> Path | None:
    env = os.getenv("STATIC_DIR")
    candidates: list[Path] = []
    if env:
        candidates.append(Path(env))
    if is_frozen():
        meipass = Path(sys._MEIPASS)  # type: ignore[attr-defined]
        candidates.extend([meipass / "static", meipass / "frontend" / "out"])
    backend_dir = Path(__file__).resolve().parent.parent
    project_root = backend_dir.parent
    candidates.extend(
        [
            backend_dir / "static",
            project_root / "frontend" / "out",
        ]
    )
    for path in candidates:
        if path.is_dir() and (path / "index.html").exists():
            return path.resolve()
    return None
