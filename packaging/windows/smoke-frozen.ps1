# Smoke test del .exe congelado (Windows / GitHub Actions).
# Uso: powershell -File packaging/windows/smoke-frozen.ps1

$ErrorActionPreference = "Stop"
$exe = Join-Path $PSScriptRoot "..\..\dist\tributacos\tributacos.exe"
if (-not (Test-Path $exe)) {
    throw "No existe $exe. Ejecuta PyInstaller primero."
}

$env:TRIBUTACOS_NO_BROWSER = "1"
$proc = Start-Process -FilePath $exe -PassThru -WindowStyle Hidden
try {
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/health" -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -eq 200) {
                $ok = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
        if ($proc.HasExited) {
            throw "tributacos.exe termino antes del health check (codigo $($proc.ExitCode))"
        }
    }
    if (-not $ok) {
        throw "Sin respuesta en /api/health tras 60 s"
    }
    Write-Host "OK: health en :8080"
} finally {
    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Get-Process -Name "tributacos" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
