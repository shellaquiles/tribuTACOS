@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title tribuTACOS

set "ROOT=%~dp0..\.."
cd /d "%ROOT%"

echo.
echo  ========================================
echo   tribuTACOS - Iniciando aplicacion...
echo  ========================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta instalado en este equipo.
    echo.
    echo Para usar tribuTACOS sin instalar Python ni Node.js necesitas:
    echo   1. Instalar Docker Desktop para Windows
    echo   2. Abrir Docker Desktop y esperar a que diga "Running"
    echo   3. Volver a ejecutar este archivo
    echo.
    echo Descarga: https://www.docker.com/products/docker-desktop/
    echo.
    start https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker esta instalado pero no esta en ejecucion.
    echo.
    echo Abre "Docker Desktop" desde el menu Inicio, espera a que inicie
    echo completamente y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

echo Preparando contenedores (la primera vez puede tardar varios minutos)...
if exist "docker\Dockerfile.backend" (
    docker compose up --build -d
) else if exist "docker-compose.published.yml" (
    docker compose -f docker-compose.published.yml up -d
) else (
    docker compose up -d
)
if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo iniciar tribuTACOS.
    echo Revisa que Docker Desktop este activo e intenta de nuevo.
    pause
    exit /b 1
)

echo.
echo Esperando a que la aplicacion este lista...
timeout /t 8 /nobreak >nul

echo.
echo  ========================================
echo   tribuTACOS esta listo
echo   Abriendo http://localhost:3000
echo  ========================================
echo.
echo Para detener la aplicacion ejecuta: Detener-Tributacos.bat
echo.

start http://localhost:3000
pause
