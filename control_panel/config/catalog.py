"""Catalogo de pestañas y ensamblado de acciones."""

from __future__ import annotations

from control_panel.config.constants import Cmd, DistributionMode, TabId
from control_panel.config.copy import (
    TASKS,
    InicioCopy,
    action_button_label,
    hero_button_label,
    release_channel,
    step_label,
    TAB_HINTS,
    TAB_LABELS,
    INGEST_COMMAND_KEYS,
    MANUAL_COMMAND_KEYS,
    MANUAL_LABELS,
)
from control_panel.domain.models import TaskAction

__all__ = [
    "TAB_LABELS",
    "TAB_HINTS",
    "INGEST_COMMAND_KEYS",
    "MANUAL_COMMAND_KEYS",
    "MANUAL_LABELS",
    "release_channel",
    "action_button_label",
    "hero_button_label",
    "step_label",
    "build_sections",
]


def _task(
    command: str,
    *,
    long_running: bool = False,
    variant: str = "default",
    step: int | None = None,
) -> TaskAction:
    spec = TASKS[command]
    return TaskAction(
        command,
        spec.label,
        spec.description,
        confirm=spec.confirm,
        long_running=long_running,
        variant=variant,
        step=step,
        icon=spec.icon,
        tooltip=spec.tooltip,
    )


def build_sections(mode: str) -> list[tuple[str, list[TaskAction]]]:
    start_cmd = (
        Cmd.STANDALONE
        if mode == DistributionMode.INSTALLED
        else (Cmd.DOCKER_UP if mode == DistributionMode.DOCKER else Cmd.STANDALONE)
    )
    start_label = (
        InicioCopy.start_label_docker
        if mode == DistributionMode.DOCKER
        else InicioCopy.start_label_default
    )
    start_desc = (
        InicioCopy.start_desc_docker
        if mode == DistributionMode.DOCKER
        else InicioCopy.start_desc_default
    )
    stop_cmd = Cmd.DOCKER_DOWN if mode == DistributionMode.DOCKER else Cmd.STOP

    sections: list[tuple[str, list[TaskAction]]] = [
        (
            TabId.INICIO,
            [
                TaskAction(
                    start_cmd,
                    start_label,
                    start_desc,
                    long_running=True,
                    variant="primary",
                    icon="▶",
                ),
                TaskAction(
                    stop_cmd,
                    InicioCopy.stop_label,
                    InicioCopy.stop_desc,
                    variant="secondary",
                    icon="■",
                ),
                TaskAction(
                    Cmd.OPEN_BROWSER,
                    InicioCopy.browser_label,
                    InicioCopy.browser_desc,
                    icon="↗",
                ),
            ],
        ),
        (
            TabId.ARCHIVOS,
            [
                _task(Cmd.OPEN_XML_RECIBIDOS, step=1),
                _task(Cmd.OPEN_XML_EMITIDOS, step=1),
                _task(Cmd.OPEN_PDF_SAT, step=1),
                _task(Cmd.DB_IMPORT_XML, step=2, variant="primary"),
                _task(Cmd.DB_IMPORT_SAT, step=3),
            ],
        ),
        (
            TabId.DATOS,
            [
                _task(Cmd.DB_EXPORT),
                _task(Cmd.DB_IMPORT_BACKUP),
                _task(Cmd.CLEAR_CACHE),
                _task(Cmd.DB_RESET, variant="danger"),
                _task(Cmd.DB_SEED, variant="danger"),
            ],
        ),
        (
            TabId.AYUDA,
            [
                _task(Cmd.OPEN_DATA),
                _task(Cmd.OPEN_MANUAL_INSTALL),
                _task(Cmd.OPEN_MANUAL_USER),
                _task(Cmd.OPEN_MANUAL_TECH),
                _task(Cmd.ABOUT),
            ],
        ),
    ]
    if mode in (DistributionMode.DEV, DistributionMode.DOCKER):
        system_tasks = [_task(Cmd.DOCTOR)]
        if mode == DistributionMode.DEV:
            system_tasks.append(_task(Cmd.SETUP, variant="primary"))
        sections.insert(1, (TabId.SISTEMA, system_tasks))
    return sections
