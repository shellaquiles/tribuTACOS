#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker no esta instalado."
    exit 1
}

Write-Host "Deteniendo tribuTACOS..."
if (Test-Path "docker\Dockerfile.backend") {
    docker compose down
} elseif (Test-Path "docker-compose.published.yml") {
    docker compose -f docker-compose.published.yml down
} else {
    docker compose down
}

Write-Host ""
Write-Host "tribuTACOS se detuvo. Tus datos se conservan en el volumen Docker 'tributacos-data'."
