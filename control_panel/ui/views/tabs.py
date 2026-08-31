"""Enrutado de pestañas del notebook."""

from __future__ import annotations

from typing import TYPE_CHECKING

from control_panel.config.constants import TabId
from control_panel.config.copy import DatosCopy
from control_panel.domain.models import TaskAction
from control_panel.ui.views.archivos import build_archivos_tab
from control_panel.ui.views.components import action_card, hint_banner, section_label
from control_panel.ui.views.inicio import build_inicio_tab

if TYPE_CHECKING:
    from control_panel.ui.views.builder import PanelViewBuilder


def build_tab(
    builder: PanelViewBuilder,
    parent,
    tab_id: str,
    hint: str,
    tasks: list[TaskAction],
) -> None:
    if hint:
        hint_banner(builder, parent, hint)

    if tab_id == TabId.INICIO:
        build_inicio_tab(builder, parent, tasks)
        return
    if tab_id == TabId.ARCHIVOS:
        build_archivos_tab(builder, parent, tasks)
        return

    if tab_id == TabId.DATOS:
        section_label(builder, parent, DatosCopy.safe_section)
        safe = [t for t in tasks if t.variant != "danger"]
        danger = [t for t in tasks if t.variant == "danger"]
        for task in safe:
            action_card(builder, parent, task)
        if danger:
            section_label(builder, parent, DatosCopy.danger_section, danger=True)
            for task in danger:
                action_card(builder, parent, task)
        return

    for task in tasks:
        action_card(builder, parent, task)
