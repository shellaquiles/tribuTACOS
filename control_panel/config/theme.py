"""Paleta visual y estilos ttk del panel."""

from __future__ import annotations

import sys
from dataclasses import dataclass
from typing import TYPE_CHECKING

from tkinter import font as tkfont
from tkinter import ttk

from control_panel.config.constants import (
    DEFAULT_UI_FONT,
    MONO_FONT_UNIX,
    MONO_FONT_WIN,
    START_COMMANDS,
    StatusKind,
    STOP_COMMANDS,
    TTK_THEME,
    UI_FONT_CANDIDATES,
    Cmd,
)

if TYPE_CHECKING:
    import tkinter as tk

    from control_panel.domain.models import TaskAction


@dataclass(frozen=True, slots=True)
class Theme:
    bg: str = "#f8fafc"
    surface: str = "#ffffff"
    border: str = "#e2e8f0"
    text: str = "#0f172a"
    muted: str = "#64748b"
    subtle: str = "#94a3b8"
    brand: str = "#0f172a"
    blue: str = "#1d4ed8"
    success: str = "#15803d"
    success_bg: str = "#dcfce7"
    warning: str = "#b45309"
    warning_bg: str = "#fef3c7"
    danger: str = "#b91c1c"
    danger_bg: str = "#fef2f2"
    header_bg: str = "#0f172a"
    header_fg: str = "#f8fafc"
    header_subtitle_fg: str = "#94a3b8"
    header_link_fg: str = "#93c5fd"
    header_version_fg: str = "#cbd5e1"
    header_meta_fg: str = "#94a3b8"
    accent: str = "#2563eb"
    accent_hover: str = "#1d4ed8"
    surface_alt: str = "#f1f5f9"
    info_bg: str = "#eff6ff"
    info_border: str = "#bfdbfe"
    card_accent: str = "#2563eb"
    card_accent_danger: str = "#b91c1c"
    card_accent_muted: str = "#e2e8f0"
    status_pill_bg: str = "#1e293b"
    channel_badge_fg: str = "#64748b"
    channel_badge_bg: str = "#1e293b"
    log_bg: str = "#0f172a"
    log_fg: str = "#e2e8f0"
    tooltip_bg: str = "#1e293b"
    tooltip_fg: str = "#f8fafc"
    on_primary_fg: str = "#ffffff"
    on_primary_active_bg: str = "#1e293b"
    danger_btn_active_bg: str = "#fecaca"
    status_stopped: str = "#94a3b8"
    status_online: str = "#4ade80"
    status_starting: str = "#fbbf24"
    status_error: str = "#f87171"
    status_busy: str = "#93c5fd"

    def status_color(self, kind: str) -> str:
        return {
            StatusKind.STOPPED: self.status_stopped,
            StatusKind.ONLINE: self.status_online,
            StatusKind.STARTING: self.status_starting,
            StatusKind.ERROR: self.status_error,
            StatusKind.BUSY: self.status_busy,
        }.get(kind, self.subtle)


THEME = Theme()


def pick_ui_font(root: tk.Misc) -> str:
    available = {name.lower() for name in tkfont.families(root)}
    for name in UI_FONT_CANDIDATES:
        if name.lower() in available:
            return name
    return DEFAULT_UI_FONT


def mono_font() -> str:
    return MONO_FONT_WIN if sys.platform == "win32" else MONO_FONT_UNIX


def apply_ttk_theme(style: ttk.Style, ui_font: str, theme: Theme = THEME) -> None:
    if TTK_THEME in style.theme_names():
        style.theme_use(TTK_THEME)

    style.configure(".", background=theme.bg, foreground=theme.text, font=(ui_font, 10))
    style.configure("TFrame", background=theme.bg)
    style.configure("Card.TFrame", background=theme.surface)
    style.configure("Surface.TFrame", background=theme.surface)

    style.configure(
        "TNotebook",
        background=theme.bg,
        borderwidth=0,
        tabmargins=(0, 0, 0, 0),
    )
    style.configure(
        "TNotebook.Tab",
        padding=(18, 10),
        font=(ui_font, 10),
        background=theme.surface_alt,
        foreground=theme.muted,
        borderwidth=0,
    )
    style.map(
        "TNotebook.Tab",
        background=[("selected", theme.surface), ("active", theme.surface)],
        foreground=[("selected", theme.text), ("active", theme.text)],
        expand=[("selected", (0, 0, 2, 0))],
    )
    style.configure("TScrollbar", background=theme.border, troughcolor=theme.bg, borderwidth=0)

    button_specs = (
        ("Primary", theme.brand, theme.on_primary_fg, theme.on_primary_active_bg),
        ("Accent", theme.accent, theme.on_primary_fg, theme.accent_hover),
        ("Secondary", theme.surface_alt, theme.text, theme.border),
        ("Danger", theme.danger_bg, theme.danger, theme.danger_btn_active_bg),
        ("Ghost", theme.surface, theme.muted, theme.surface_alt),
    )
    for name, bg, fg, active in button_specs:
        style.configure(
            f"{name}.TButton",
            background=bg,
            foreground=fg,
            borderwidth=0,
            focusthickness=0,
            focuscolor=bg,
            padding=(18, 10),
            font=(ui_font, 10, "bold" if name in ("Primary", "Accent") else "normal"),
        )
        style.map(
            f"{name}.TButton",
            background=[("active", active), ("disabled", theme.surface_alt)],
            foreground=[("disabled", theme.subtle)],
        )

    for variant, padding in (("Primary", (14, 6)), ("Secondary", (14, 6)), ("Danger", (14, 6))):
        style.configure(
            f"Small.{variant}.TButton",
            padding=padding,
            font=(ui_font, 9, "bold" if variant == "Primary" else "normal"),
        )


def button_style(task: TaskAction, *, large: bool = False, theme: Theme = THEME) -> str:
    if task.variant == "danger":
        return "Danger.TButton" if large else "Small.Danger.TButton"
    if task.variant == "primary" or task.command in START_COMMANDS | {Cmd.SETUP}:
        return "Primary.TButton" if large else "Small.Primary.TButton"
    if task.variant == "secondary" or task.command in STOP_COMMANDS:
        return "Secondary.TButton" if large else "Small.Secondary.TButton"
    if task.command == Cmd.OPEN_BROWSER:
        return "Accent.TButton" if large else "Small.Primary.TButton"
    return "Secondary.TButton" if large else "Small.Secondary.TButton"


def accent_for_task(task: TaskAction, theme: Theme = THEME) -> str:
    if task.variant == "danger":
        return theme.card_accent_danger
    if task.variant == "primary" or task.step == 2:
        return theme.card_accent
    return theme.card_accent_muted
