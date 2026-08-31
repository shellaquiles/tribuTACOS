"""Widgets reutilizables del panel."""

from __future__ import annotations

import tkinter as tk

from control_panel.config.theme import Theme, THEME


class ToolTip:
    """Tooltip al pasar el mouse (Tk no trae uno nativo en todos los widgets)."""

    def __init__(
        self,
        widget: tk.Misc,
        text: str,
        font: str,
        theme: Theme = THEME,
    ) -> None:
        self.widget = widget
        self.text = text.strip()
        self.font = font
        self.theme = theme
        self._tip: tk.Toplevel | None = None
        if self.text:
            widget.bind("<Enter>", self._show, add="+")
            widget.bind("<Leave>", self._hide, add="+")

    def _show(self, _event: object = None) -> None:
        if not self.text or self._tip is not None:
            return
        x = self.widget.winfo_rootx() + 12
        y = self.widget.winfo_rooty() + self.widget.winfo_height() + 6
        tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        tk.Label(
            tw,
            text=self.text,
            font=(self.font, 9),
            bg=self.theme.tooltip_bg,
            fg=self.theme.tooltip_fg,
            padx=10,
            pady=8,
            wraplength=340,
            justify="left",
        ).pack()
        self._tip = tw

    def _hide(self, _event: object = None) -> None:
        if self._tip is not None:
            self._tip.destroy()
            self._tip = None
