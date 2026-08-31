"""Cabecera, registro de actividad y pie de pagina."""

from __future__ import annotations

from typing import TYPE_CHECKING

from tkinter import LEFT, RIGHT, X, ttk
import tkinter as tk

from control_panel.config.catalog import release_channel
from control_panel.config.constants import Layout, StatusKind
from control_panel.config.copy import BRAND, DISTRIBUTION_MODE_LABELS, ShellCopy, STATUS_LABELS

if TYPE_CHECKING:
    from control_panel.ui.views.builder import PanelViewBuilder


def build_header(builder: PanelViewBuilder) -> None:
    panel = builder.panel
    theme = builder.theme
    header = tk.Frame(panel, bg=theme.header_bg)
    header.pack(fill=X)

    bar = tk.Frame(header, bg=theme.header_bg, padx=24, pady=16)
    bar.pack(fill=X)

    left = tk.Frame(bar, bg=theme.header_bg)
    left.pack(side=LEFT, fill=X, expand=True)
    tk.Label(
        left,
        text=BRAND.name,
        font=(builder.ui_font, 18, "bold"),
        fg=theme.header_fg,
        bg=theme.header_bg,
        anchor="w",
    ).pack(anchor="w")
    tk.Label(
        left,
        text=BRAND.panel_title,
        font=(builder.ui_font, 10),
        fg=theme.header_subtitle_fg,
        bg=theme.header_bg,
        anchor="w",
    ).pack(anchor="w", pady=(2, 0))

    right = tk.Frame(bar, bg=theme.header_bg)
    right.pack(side=RIGHT)

    mode_label = DISTRIBUTION_MODE_LABELS.get(panel.mode, panel.mode)
    meta = tk.Frame(right, bg=theme.header_bg)
    meta.pack(anchor="e")
    about_btn = tk.Label(
        meta,
        text=ShellCopy.about_link,
        font=(builder.ui_font, 9),
        fg=theme.header_link_fg,
        bg=theme.header_bg,
        cursor="hand2",
    )
    about_btn.pack(side=RIGHT, padx=(12, 0))
    about_btn.bind("<Button-1>", lambda _e: panel._about.show())
    tk.Label(
        meta,
        text=f"v{panel.version}",
        font=(builder.mono_font, 9),
        fg=theme.header_version_fg,
        bg=theme.header_bg,
    ).pack(side=LEFT, padx=(0, 8))
    tk.Label(
        meta,
        text=release_channel(panel.version),
        font=(builder.ui_font, 8, "bold"),
        fg=theme.channel_badge_fg,
        bg=theme.channel_badge_bg,
        padx=6,
        pady=2,
    ).pack(side=LEFT, padx=(0, 8))
    tk.Label(
        meta,
        text=mode_label,
        font=(builder.ui_font, 8),
        fg=theme.header_meta_fg,
        bg=theme.header_bg,
    ).pack(side=LEFT)

    status = tk.Frame(right, bg=theme.status_pill_bg, padx=12, pady=8)
    status.pack(anchor="e", pady=(10, 0))
    panel._status_dot = tk.Canvas(
        status,
        width=Layout.STATUS_DOT_SIZE,
        height=Layout.STATUS_DOT_SIZE,
        bg=theme.status_pill_bg,
        highlightthickness=0,
    )
    panel._status_dot.pack(side=LEFT, padx=(0, 8))
    panel._dot_id = panel._status_dot.create_oval(2, 2, 8, 8, fill=theme.subtle, outline="")
    panel.status_var = tk.StringVar(value=STATUS_LABELS[StatusKind.STOPPED])
    tk.Label(
        status,
        textvariable=panel.status_var,
        font=(builder.ui_font, 10, "bold"),
        fg=theme.header_fg,
        bg=theme.status_pill_bg,
    ).pack(side=LEFT)

    tk.Frame(header, bg=theme.accent, height=Layout.HEADER_ACCENT_HEIGHT).pack(fill=X)


def build_log(builder: PanelViewBuilder) -> None:
    panel = builder.panel
    theme = builder.theme
    log_wrap = tk.Frame(panel, bg=theme.bg)
    log_wrap.pack(fill=X, padx=20, pady=(10, 0))
    log_panel = tk.Frame(log_wrap, bg=theme.surface, highlightbackground=theme.border, highlightthickness=1)
    log_panel.pack(fill=X)

    log_head = tk.Frame(log_panel, bg=theme.surface)
    log_head.pack(fill=X, padx=16, pady=(10, 4))
    tk.Label(
        log_head,
        text=ShellCopy.log_heading,
        font=(builder.ui_font, 8, "bold"),
        fg=theme.muted,
        bg=theme.surface,
    ).pack(side=LEFT)
    ttk.Button(log_head, text=ShellCopy.log_clear, style="Ghost.TButton", command=panel.clear_log).pack(
        side=RIGHT
    )

    panel.log_text = tk.Text(
        log_panel,
        wrap="word",
        height=Layout.LOG_HEIGHT,
        font=(builder.mono_font, 9),
        state="disabled",
        bg=theme.log_bg,
        fg=theme.log_fg,
        insertbackground=theme.log_fg,
        bd=0,
        highlightthickness=0,
        padx=16,
        pady=10,
    )
    panel.log_text.pack(fill=X, padx=1, pady=(0, 1))


def build_footer(builder: PanelViewBuilder) -> None:
    panel = builder.panel
    theme = builder.theme
    footer = tk.Frame(panel, bg=theme.bg)
    footer.pack(fill=X, padx=20, pady=10)
    tk.Label(
        footer,
        text=ShellCopy.footer,
        font=(builder.ui_font, 8),
        fg=theme.subtle,
        bg=theme.bg,
    ).pack(side=LEFT)
    link = tk.Label(
        footer,
        text=ShellCopy.about_link,
        font=(builder.ui_font, 8, "bold"),
        fg=theme.accent,
        bg=theme.bg,
        cursor="hand2",
    )
    link.pack(side=RIGHT)
    link.bind("<Button-1>", lambda _e: panel._about.show())
