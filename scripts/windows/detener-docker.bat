@echo off
chcp 65001 >nul
title tribuTACOS - Detener

set "ROOT=%~dp0..\.."
cd /d "%ROOT%"

where docker >nul 2>&1
if errorlevel 1 (
    echo Docker no esta instalado.
    pause
    exit /b 1
)

echo Deteniendo tribuTACOS...
if exist "docker\Dockerfile.backend" (
    docker compose down
) else if exist "docker-compose.published.yml" (
    docker compose -f docker-compose.published.yml down
) else (
    docker compose down
)

echo.
echo tribuTACOS se detuvo correctamente.
echo Tus datos se conservan en el volumen Docker "tributacos-data".
echo.
pause
