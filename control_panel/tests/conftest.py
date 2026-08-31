"""Fixtures compartidas para tests del panel."""

from __future__ import annotations

import pytest


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "gui: pruebas que instancian Tkinter (requieren display o xvfb)",
    )


@pytest.fixture
def require_tk() -> None:
    """Omite el test si no hay Tcl/Tk usable (p. ej. CI sin display)."""
    tk = pytest.importorskip("tkinter")
    root = tk.Tk()
    root.withdraw()
    try:
        root.update_idletasks()
    finally:
        root.destroy()
