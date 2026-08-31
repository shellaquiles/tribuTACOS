"""Dialogo Acerca de y soporte."""

from __future__ import annotations

import sys
import webbrowser
from typing import Callable

import tkinter as tk
from tkinter import BOTH, X
from tkinter.scrolledtext import ScrolledText

from control_panel.config.constants import Layout
from control_panel.config.copy import (
    BRAND,
    AboutCopy,
    DISCLAIMER,
    SCREENSHOT_HINTS,
    about_body,
    about_subtitle,
)
from control_panel.config.theme import Theme, THEME


def screenshot_hint() -> str:
    return SCREENSHOT_HINTS.get(sys.platform, SCREENSHOT_HINTS["default"])


class AboutDialog:
    """Ventana modal con contacto, aviso legal y ficha tecnica."""

    def __init__(
        self,
        parent: tk.Misc,
        *,
        version: str,
        ui_font: str,
        diagnostic_text: Callable[[], str],
        on_copy: Callable[[str, str], None],
        theme: Theme = THEME,
    ) -> None:
        self._parent = parent
        self._window: tk.Toplevel | None = None
        self._version = version
        self._ui_font = ui_font
        self._diagnostic_text = diagnostic_text
        self._on_copy = on_copy
        self._theme = theme

    def show(self) -> None:
        if self._window is not None and self._window.winfo_exists():
            self._window.lift()
            self._window.focus_force()
            return

        win = tk.Toplevel(self._parent)
        self._window = win
        win.title(BRAND.about_title)
        win.configure(bg=self._theme.surface)
        win.geometry(Layout.ABOUT_GEOMETRY)
        win.minsize(Layout.ABOUT_MIN_WIDTH, Layout.ABOUT_MIN_HEIGHT)
        win.transient(self._parent)
        win.protocol("WM_DELETE_WINDOW", self._close)

        pad = tk.Frame(win, bg=self._theme.surface, padx=18, pady=14)
        pad.pack(fill=BOTH, expand=True)

        tk.Label(
            pad,
            text=BRAND.name,
            font=(self._ui_font, 16, "bold"),
            fg=self._theme.text,
            bg=self._theme.surface,
            anchor="w",
        ).pack(fill=X)
        tk.Label(
            pad,
            text=about_subtitle(self._version),
            font=(self._ui_font, 9),
            fg=self._theme.muted,
            bg=self._theme.surface,
            anchor="w",
        ).pack(fill=X, pady=(0, 10))

        body = ScrolledText(
            pad,
            wrap="word",
            height=22,
            font=(self._ui_font, 10),
            bg=self._theme.bg,
            fg=self._theme.text,
            bd=0,
            highlightthickness=1,
            highlightbackground=self._theme.border,
            padx=10,
            pady=10,
        )
        body.pack(fill=BOTH, expand=True)
        shot = screenshot_hint().replace("\n", "\n     ")
        body.insert("1.0", about_body(self._version, shot))
        body.configure(state="disabled")

        row1 = tk.Frame(pad, bg=self._theme.surface)
        row1.pack(fill=X, pady=(12, 0))
        self._link_button(
            row1,
            AboutCopy.copy_diagnostic,
            lambda: self._on_copy(self._diagnostic_text(), AboutCopy.diagnostic_copied),
            primary=True,
        )
        self._link_button(
            row1,
            AboutCopy.copy_disclaimer,
            lambda: self._on_copy(DISCLAIMER, AboutCopy.disclaimer_copied),
        )

        row2 = tk.Frame(pad, bg=self._theme.surface)
        row2.pack(fill=X, pady=(8, 0))
        self._link_button(row2, AboutCopy.open_web, lambda: webbrowser.open(BRAND.site))
        self._link_button(row2, AboutCopy.send_email, lambda: webbrowser.open(f"mailto:{BRAND.email}"))
        self._link_button(row2, AboutCopy.open_issues, lambda: webbrowser.open(BRAND.issues))
        tk.Button(
            row2,
            text=AboutCopy.close,
            command=self._close,
            font=(self._ui_font, 9),
            bg=self._theme.surface,
            fg=self._theme.muted,
            relief="flat",
            bd=0,
            padx=8,
            pady=6,
            cursor="hand2",
        ).pack(side=RIGHT)

    def _link_button(
        self,
        parent: tk.Misc,
        label: str,
        command: Callable[[], None],
        *,
        primary: bool = False,
    ) -> None:
        theme = self._theme
        tk.Button(
            parent,
            text=label,
            command=command,
            font=(self._ui_font, 9, "bold" if primary else "normal"),
            bg=theme.brand if primary else theme.surface,
            fg=theme.on_primary_fg if primary else theme.text,
            activebackground=theme.on_primary_active_bg if primary else theme.surface_alt,
            activeforeground=theme.on_primary_fg if primary else theme.text,
            relief="flat",
            bd=0,
            highlightthickness=1,
            highlightbackground=theme.border,
            padx=10,
            pady=6,
            cursor="hand2",
        ).pack(side=LEFT, padx=(0, 8))

    def _close(self) -> None:
        if self._window is not None:
            self._window.destroy()
        self._window = None
