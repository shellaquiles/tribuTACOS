"""Tests de catalogo, copy y constantes (sin Tkinter)."""

from __future__ import annotations

import pytest

from control_panel.config.catalog import build_sections
from control_panel.config.constants import Cmd, DistributionMode, TabId
from control_panel.config.copy import (
    TASKS,
    action_button_label,
    hero_button_label,
    release_channel,
    step_label,
)
from control_panel.domain.models import TaskAction


@pytest.mark.parametrize(
    ("mode", "expected_tabs"),
    [
        (DistributionMode.INSTALLED, {TabId.INICIO, TabId.ARCHIVOS, TabId.DATOS, TabId.AYUDA}),
        (DistributionMode.DOCKER, {TabId.INICIO, TabId.SISTEMA, TabId.ARCHIVOS, TabId.DATOS, TabId.AYUDA}),
        (DistributionMode.DEV, {TabId.INICIO, TabId.SISTEMA, TabId.ARCHIVOS, TabId.DATOS, TabId.AYUDA}),
    ],
)
def test_build_sections_tab_ids(mode: str, expected_tabs: set[str]) -> None:
    sections = build_sections(mode)
    assert {tab_id for tab_id, _ in sections} == expected_tabs


def test_build_sections_inicio_commands_installed() -> None:
    sections = dict(build_sections(DistributionMode.INSTALLED))
    commands = {t.command for t in sections[TabId.INICIO]}
    assert commands == {Cmd.STANDALONE, Cmd.STOP, Cmd.OPEN_BROWSER}


def test_build_sections_archivos_tasks_from_copy() -> None:
    sections = dict(build_sections(DistributionMode.INSTALLED))
    archivos = sections[TabId.ARCHIVOS]
    assert [t.command for t in archivos] == [
        Cmd.OPEN_XML_RECIBIDOS,
        Cmd.OPEN_XML_EMITIDOS,
        Cmd.OPEN_PDF_SAT,
        Cmd.DB_IMPORT_XML,
        Cmd.DB_IMPORT_SAT,
    ]
    for task in archivos:
        spec = TASKS[task.command]
        assert task.label == spec.label
        assert task.description == spec.description


def test_action_button_labels() -> None:
    assert action_button_label(Cmd.DB_IMPORT_XML) == "Procesar XML"
    assert action_button_label(Cmd.DB_IMPORT_SAT) == "Procesar PDFs"
    assert action_button_label(Cmd.OPEN_DATA) == "Abrir"


def test_hero_button_labels() -> None:
    task = TaskAction(Cmd.STANDALONE, "Iniciar tribuTACOS", "desc")
    assert hero_button_label(Cmd.STANDALONE, task.label) == "Iniciar"
    assert hero_button_label(Cmd.OPEN_BROWSER, task.label) == "Abrir navegador"


def test_release_channel() -> None:
    assert release_channel("1.2.3") == "STABLE"
    assert release_channel("1.2.3-rc.4") == "RC"


def test_step_label() -> None:
    assert step_label(2) == "PASO 2"


def test_task_action_frozen() -> None:
    task = TaskAction("cmd", "Label", "Desc")
    with pytest.raises(AttributeError):
        task.label = "Otro"  # type: ignore[misc]
