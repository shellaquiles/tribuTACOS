"""Orquestador de vistas del panel."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tkinter import BOTH, X, ttk
import tkinter as tk

from control_panel.config.catalog import TAB_HINTS, TAB_LABELS, build_sections
from control_panel.config.constants import Layout
from control_panel.domain.models import TaskAction
from control_panel.ui.views.shell import build_footer, build_header, build_log
from control_panel.ui.views.tabs import build_tab

if TYPE_CHECKING:
    from control_panel.domain.panel import OperationsPanel


class PanelViewBuilder:
    """Construye la UI del panel delegando en modulos por pestaña."""

    def __init__(self, panel: OperationsPanel) -> None:
        self.panel = panel

    @property
    def theme(self):
        return self.panel._theme

    @property
    def ui_font(self) -> str:
        return self.panel._ui_font

    @property
    def mono_font(self) -> str:
        return self.panel._mono_font

    def register_control(self, btn: ttk.Button, task: TaskAction) -> None:
        self.panel._action_controls.append((btn, task))

    def build_layout(self) -> None:
        panel = self.panel
        build_header(self)

        panel._busy_bar = tk.Frame(panel, bg=self.theme.header_bg, height=Layout.BUSY_BAR_HEIGHT)
        panel._busy_bar.pack(fill=X)
        panel._busy_bar.pack_propagate(False)

        mid = tk.Frame(panel, bg=self.theme.bg)
        mid.pack(fill=BOTH, expand=True, padx=20, pady=(12, 0))

        notebook = ttk.Notebook(mid)
        notebook.pack(fill=BOTH, expand=True)
        panel._notebook = notebook

        for tab_id, tasks in build_sections(panel.mode):
            tab = tk.Frame(notebook, bg=self.theme.bg, padx=2, pady=10)
            notebook.add(tab, text=TAB_LABELS.get(tab_id, tab_id))
            build_tab(self, tab, tab_id, TAB_HINTS.get(tab_id, ""), tasks)

        build_log(self)
        build_footer(self)
