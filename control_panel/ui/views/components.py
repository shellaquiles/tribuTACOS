"""Componentes reutilizables de layout."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tkinter import BOTH, LEFT, RIGHT, X, Y, ttk
import tkinter as tk

from control_panel.config.catalog import action_button_label, hero_button_label, step_label
from control_panel.config.constants import Cmd, Layout, OPEN_COMMAND_PREFIX
from control_panel.config.copy import ArchivosCopy
from control_panel.domain.models import TaskAction
from control_panel.config.theme import accent_for_task, button_style
from control_panel.ui.widgets import ToolTip

if TYPE_CHECKING:
    from control_panel.ui.views.builder import PanelViewBuilder


def hint_banner(builder: PanelViewBuilder, parent: tk.Misc, hint: str) -> None:
    theme = builder.theme
    banner = tk.Frame(
        parent,
        bg=theme.info_bg,
        highlightbackground=theme.info_border,
        highlightthickness=1,
    )
    banner.pack(fill=X, pady=(0, 14))
    tk.Frame(banner, bg=theme.accent, width=4).pack(side=LEFT, fill=Y)
    tk.Label(
        banner,
        text=hint,
        font=(builder.ui_font, 10),
        fg=theme.text,
        bg=theme.info_bg,
        wraplength=Layout.HINT_WRAP,
        justify="left",
        anchor="w",
        padx=14,
        pady=12,
    ).pack(side=LEFT, fill=X, expand=True)


def section_label(
    builder: PanelViewBuilder,
    parent: tk.Misc,
    text: str,
    *,
    danger: bool = False,
) -> None:
    theme = builder.theme
    tk.Label(
        parent,
        text=text.upper(),
        font=(builder.ui_font, 8, "bold"),
        fg=theme.danger if danger else theme.muted,
        bg=theme.bg,
        anchor="w",
    ).pack(fill=X, pady=(0, 8) if not danger else (16, 8))


def attach_tip(builder: PanelViewBuilder, widget: tk.Misc, task: TaskAction) -> None:
    text = task.tooltip or task.description
    if text:
        ToolTip(widget, text, builder.ui_font, builder.theme)


def make_button(
    builder: PanelViewBuilder,
    parent: tk.Misc,
    task: TaskAction,
    *,
    large: bool = False,
) -> ttk.Button:
    btn = ttk.Button(
        parent,
        text=hero_button_label(task.command, task.label),
        style=button_style(task, large=large, theme=builder.theme),
        command=lambda t=task: builder.panel.run_task(t),
        takefocus=0,
    )
    builder.register_control(btn, task)
    if task.command == Cmd.OPEN_BROWSER:
        builder.panel._browser_btn = btn
    if task.command in (Cmd.STANDALONE, Cmd.DOCKER_UP):
        builder.panel._start_btn = btn
    attach_tip(builder, btn, task)
    return btn


def action_card(builder: PanelViewBuilder, parent: tk.Misc, task: TaskAction) -> None:
    theme = builder.theme
    card = tk.Frame(parent, bg=theme.surface, highlightbackground=theme.border, highlightthickness=1)
    card.pack(fill=X, pady=(0, 10))

    accent = tk.Frame(card, bg=accent_for_task(task, theme), width=4)
    accent.pack(side=LEFT, fill=Y)
    accent.pack_propagate(False)

    inner = tk.Frame(card, bg=theme.surface, padx=16, pady=14)
    inner.pack(side=LEFT, fill=BOTH, expand=True)

    content = tk.Frame(inner, bg=theme.surface)
    content.pack(side=LEFT, fill=BOTH, expand=True)

    if task.step is not None:
        tk.Label(
            content,
            text=step_label(task.step),
            font=(builder.ui_font, 7, "bold"),
            fg=theme.muted,
            bg=theme.surface,
            anchor="w",
        ).pack(fill=X)

    tk.Label(
        content,
        text=task.label,
        font=(builder.ui_font, 11, "bold"),
        fg=theme.danger if task.variant == "danger" else theme.text,
        bg=theme.surface,
        anchor="w",
    ).pack(fill=X, pady=(0, 4))

    tk.Label(
        content,
        text=task.description,
        font=(builder.ui_font, 9),
        fg=theme.muted,
        bg=theme.surface,
        wraplength=Layout.CARD_DESC_WRAP,
        justify="left",
        anchor="w",
    ).pack(fill=X)

    action_style = button_style(task, theme=theme)
    btn_text = action_button_label(task.command)
    if task.variant == "default" and task.command.startswith(OPEN_COMMAND_PREFIX):
        action_style = "Small.Secondary.TButton"
    btn = ttk.Button(
        inner,
        text=btn_text,
        style=action_style,
        command=lambda t=task: builder.panel.run_task(t),
        takefocus=0,
    )
    btn.pack(side=RIGHT, padx=(12, 0))
    builder.register_control(btn, task)
    attach_tip(builder, card, task)
    attach_tip(builder, btn, task)


def folder_row_tip(task: TaskAction, path: str) -> str:
    if task.tooltip:
        return ArchivosCopy.path_hint_template.format(tooltip=task.tooltip, path=path)
    return task.description
