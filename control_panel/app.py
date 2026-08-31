"""Punto de entrada del Panel de Operaciones."""

from __future__ import annotations

from control_panel.domain.panel import OperationsPanel


def main() -> None:
    app = OperationsPanel()
    app.protocol("WM_DELETE_WINDOW", app.on_close)
    app.mainloop()
