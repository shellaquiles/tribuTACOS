@echo off
chcp 65001 >nul
title tribuTACOS - Panel de Operaciones

set "ROOT=%~dp0..\.."
cd /d "%ROOT%"

where python >nul 2>&1
if errorlevel 1 (
    echo Python no encontrado. Instala Python 3.11+ desde https://python.org
    pause
    exit /b 1
)

python scripts\tributacos_gui.py
