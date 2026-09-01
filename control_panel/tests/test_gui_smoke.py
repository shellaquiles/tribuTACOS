"""Smoke tests de la GUI Tkinter."""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.gui


def test_operations_panel_builds(require_tk: None) -> None:
    from control_panel.domain.panel import OperationsPanel

    app = OperationsPanel()
    app.withdraw()
    try:
        app.update_idletasks()
        assert app.winfo_exists()
        assert app.log_text is not None
        assert app.status_var is not None
        assert app._busy_bar is not None
        assert app._action_controls, "debe registrar botones de accion"
        assert app._start_btn is not None
        assert app._browser_btn is not None
        assert app._guide_var is not None
        content = app.log_text.get("1.0", "end").strip()
        assert "Panel de Operaciones" in content
        assert app._url in content
    finally:
        app.destroy()


def test_operations_panel_tabs_have_actions(require_tk: None) -> None:
    from control_panel.config.catalog import build_sections
    from control_panel.domain.panel import OperationsPanel

    app = OperationsPanel()
    app.withdraw()
    try:
        expected = sum(len(tasks) for _, tasks in build_sections(app.mode))
        assert len(app._action_controls) >= expected - 2
    finally:
        app.destroy()


def test_main_entrypoint_importable() -> None:
    from control_panel.gui import main

    assert callable(main)
