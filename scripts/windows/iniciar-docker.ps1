#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   tribuTACOS - Iniciando aplicacion..." -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

function Show-DockerInstallHelp {
    Write-Host "[ERROR] Docker no esta instalado o no esta en ejecucion." -ForegroundColor Red
    Write-Host ""
    Write-Host "Para usar tribuTACOS sin instalar Python ni Node.js:" -ForegroundColor Yellow
    Write-Host "  1. Instala Docker Desktop para Windows"
    Write-Host "  2. Abre Docker Desktop y espera a que diga 'Running'"
    Write-Host "  3. Vuelve a ejecutar este script"
    Write-Host ""
    Write-Host "Descarga: https://www.docker.com/products/docker-desktop/"
    Start-Process "https://www.docker.com/products/docker-desktop/"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Show-DockerInstallHelp
    exit 1
}

try {
    docker info | Out-Null
} catch {
    Show-DockerInstallHelp
    exit 1
}

Write-Host "Preparando contenedores (la primera vez puede tardar varios minutos)..."
if (Test-Path "docker\Dockerfile.backend") {
    docker compose up --build -d
} elseif (Test-Path "docker-compose.published.yml") {
    docker compose -f docker-compose.published.yml up -d
} else {
    docker compose up -d
}
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] No se pudo iniciar tribuTACOS." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Esperando a que la aplicacion este lista..."
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "  tribuTACOS esta listo en http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Para detener: Detener-Tributacos.bat o scripts\windows\detener-docker.ps1"
Write-Host ""

Start-Process "http://localhost:3000"
