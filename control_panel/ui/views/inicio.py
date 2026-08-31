"""Pestaña Inicio: arranque del servidor local."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tkinter import LEFT, X, ttk
import tkinter as tk

from control_panel.config.constants import Cmd, Layout
from control_panel.config.copy import InicioCopy
from control_panel.domain.models import TaskAction
from control_panel.ui.views.components import make_button
from control_panel.infra.bootstrap import ensure_import_paths

ensure_import_paths()

from tributacos_core.runtime import get_app_url

if TYPE_CHECKING:
    from control_panel.ui.views.builder import PanelViewBuilder


def build_inicio_tab(
    builder: PanelViewBuilder,
    parent: tk.Misc,
    tasks: list[TaskAction],
) -> None:
    panel = builder.panel
    theme = builder.theme
    hero = tk.Frame(parent, bg=theme.surface, highlightbackground=theme.border, highlightthickness=1)
    hero.pack(fill=X)

    body = tk.Frame(hero, bg=theme.surface, padx=20, pady=20)
    body.pack(fill=X)

    tk.Label(
        body,
        text=InicioCopy.section,
        font=(builder.ui_font, 8, "bold"),
        fg=theme.muted,
        bg=theme.surface,
        anchor="w",
    ).pack(fill=X)
    tk.Label(
        body,
        text=InicioCopy.title,
        font=(builder.ui_font, 15, "bold"),
        fg=theme.text,
        bg=theme.surface,
        anchor="w",
    ).pack(fill=X, pady=(2, 6))
    tk.Label(
        body,
        text=InicioCopy.description,
        font=(builder.ui_font, 10),
        fg=theme.muted,
        bg=theme.surface,
        wraplength=Layout.HERO_WRAP,
        justify="left",
        anchor="w",
    ).pack(fill=X, pady=(0, 18))

    row = tk.Frame(body, bg=theme.surface)
    row.pack(fill=X)

    by_cmd = {t.command: t for t in tasks}
    start = by_cmd.get(Cmd.STANDALONE) or by_cmd.get(Cmd.DOCKER_UP)
    stop = by_cmd.get(Cmd.STOP) or by_cmd.get(Cmd.DOCKER_DOWN)
    browser = by_cmd.get(Cmd.OPEN_BROWSER)

    if start:
        panel._start_btn = make_button(builder, row, start, large=True)
        panel._start_btn.pack(side=LEFT, padx=(0, 10))
    if stop:
        make_button(builder, row, stop, large=True).pack(side=LEFT, padx=(0, 10))
    if browser:
        panel._browser_btn = make_button(builder, row, browser, large=True)
        panel._browser_btn.pack(side=LEFT)

    guide_wrap = tk.Frame(
        body,
        bg=theme.info_bg,
        highlightbackground=theme.info_border,
        highlightthickness=1,
    )
    guide_wrap.pack(fill=X, pady=(18, 0))
    panel._guide_var = tk.StringVar()
    tk.Label(
        guide_wrap,
        textvariable=panel._guide_var,
        font=(builder.ui_font, 10),
        fg=theme.text,
        bg=theme.info_bg,
        anchor="w",
        wraplength=Layout.HERO_WRAP,
        justify="left",
        padx=14,
        pady=12,
    ).pack(fill=X)

    url_row = tk.Frame(body, bg=theme.surface)
    url_row.pack(fill=X, pady=(16, 0))
    tk.Label(
        url_row,
        text=InicioCopy.url_heading,
        font=(builder.ui_font, 8, "bold"),
        fg=theme.muted,
        bg=theme.surface,
    ).pack(anchor="w")
    link_row = tk.Frame(url_row, bg=theme.surface)
    link_row.pack(fill=X, pady=(4, 0))
    url_lbl = tk.Label(
        link_row,
        text=get_app_url(),
        font=(builder.mono_font, 10),
        fg=theme.accent,
        bg=theme.surface,
        cursor="hand2",
    )
    url_lbl.pack(side=LEFT)
    url_lbl.bind("<Button-1>", lambda _e: panel._open_browser())
    ttk.Button(
        link_row,
        text=InicioCopy.copy_url,
        style="Ghost.TButton",
        command=panel._copy_url,
    ).pack(side=LEFT, padx=(12, 0))
