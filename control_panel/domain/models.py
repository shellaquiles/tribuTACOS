"""Modelos de dominio del panel."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TaskAction:
    command: str
    label: str
    description: str
    confirm: str | None = None
    long_running: bool = False
    variant: str = "default"
    visible_in: tuple[str, ...] = ("installed", "docker", "dev")
    step: int | None = None
    icon: str = ""
    tooltip: str = ""
