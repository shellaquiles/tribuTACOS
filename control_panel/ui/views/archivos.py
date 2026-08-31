"""Pestaña Tus archivos: carpetas de ingesta y procesamiento."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tkinter import BOTH, LEFT, RIGHT, X, Y, ttk
import tkinter as tk

from control_panel.config.constants import Cmd, Layout
from control_panel.config.copy import ArchivosCopy
from control_panel.domain.models import TaskAction
from control_panel.ui.views.components import action_card, folder_row_tip
from control_panel.ui.widgets import ToolTip

if TYPE_CHECKING:
    from control_panel.ui.views.builder import PanelViewBuilder

from control_panel.infra.bootstrap import ensure_import_paths

ensure_import_paths()

from tributacos_core.runtime import ingest_folders


def build_archivos_tab(
    builder: PanelViewBuilder,
    parent: tk.Misc,
    tasks: list[TaskAction],
) -> None:
    theme = builder.theme
    by_cmd = {t.command: t for t in tasks}
    folders = [
        by_cmd[Cmd.OPEN_XML_RECIBIDOS],
        by_cmd[Cmd.OPEN_XML_EMITIDOS],
        by_cmd[Cmd.OPEN_PDF_SAT],
    ]
    scan = by_cmd[Cmd.DB_IMPORT_XML]
    sat = by_cmd[Cmd.DB_IMPORT_SAT]
    paths = ingest_folders()

    card = tk.Frame(parent, bg=theme.surface, highlightbackground=theme.border, highlightthickness=1)
    card.pack(fill=X, pady=(0, 10))
    tk.Frame(card, bg=theme.card_accent, width=4).pack(side=LEFT, fill=Y)
    body = tk.Frame(card, bg=theme.surface, padx=16, pady=14)
    body.pack(side=LEFT, fill=BOTH, expand=True)

    tk.Label(
        body,
        text=ArchivosCopy.step_one,
        font=(builder.ui_font, 7, "bold"),
        fg=theme.muted,
        bg=theme.surface,
        anchor="w",
    ).pack(fill=X)
    tk.Label(
        body,
        text=ArchivosCopy.step_title,
        font=(builder.ui_font, 11, "bold"),
        fg=theme.text,
        bg=theme.surface,
        anchor="w",
    ).pack(fill=X, pady=(0, 4))
    tk.Label(
        body,
        text=ArchivosCopy.step_description,
        font=(builder.ui_font, 9),
        fg=theme.muted,
        bg=theme.surface,
        wraplength=Layout.ARCHIVOS_DESC_WRAP,
        justify="left",
        anchor="w",
    ).pack(fill=X, pady=(0, 10))

    path_map = {
        Cmd.OPEN_XML_RECIBIDOS: paths["recibidos"],
        Cmd.OPEN_XML_EMITIDOS: paths["emitidos"],
        Cmd.OPEN_PDF_SAT: paths["descargados"],
    }
    for task in folders:
        row = tk.Frame(body, bg=theme.surface_alt, padx=12, pady=10)
        row.pack(fill=X, pady=(0, 6))
        text_col = tk.Frame(row, bg=theme.surface_alt)
        text_col.pack(side=LEFT, fill=BOTH, expand=True)
        tk.Label(
            text_col,
            text=task.label,
            font=(builder.ui_font, 10, "bold"),
            fg=theme.text,
            bg=theme.surface_alt,
            anchor="w",
        ).pack(fill=X)
        tk.Label(
            text_col,
            text=task.description,
            font=(builder.ui_font, 9),
            fg=theme.muted,
            bg=theme.surface_alt,
            anchor="w",
        ).pack(fill=X)
        btn = ttk.Button(
            row,
            text=ArchivosCopy.open_folder,
            style="Small.Secondary.TButton",
            command=lambda t=task: builder.panel.run_task(t),
        )
        btn.pack(side=RIGHT, padx=(12, 0))
        builder.register_control(btn, task)
        tip = folder_row_tip(task, str(path_map.get(task.command, "")))
        ToolTip(row, tip, builder.ui_font, theme)
        ToolTip(btn, tip, builder.ui_font, theme)

    action_card(builder, parent, scan)
    action_card(builder, parent, sat)
