@echo off
setlocal

set "ROOT=%~dp0..\.."
set "RUNNER=%ROOT%\scripts\tributacos.py"
cd /d "%ROOT%"

where python >nul 2>&1
if errorlevel 1 (
    echo Python no encontrado. Instala Python 3.11+ desde https://python.org
    exit /b 1
)

if "%~1"=="" (
    python "%RUNNER%" help
) else (
    python "%RUNNER%" %*
)
