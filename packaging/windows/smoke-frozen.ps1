# Smoke test del .exe congelado (Windows / GitHub Actions).
# Uso: powershell -File packaging/windows/smoke-frozen.ps1

$ErrorActionPreference = "Stop"
$exe = Join-Path $PSScriptRoot "..\..\dist\tributacos\tributacos.exe"
if (-not (Test-Path $exe)) {
    throw "No existe $exe. Ejecuta PyInstaller primero."
}

$env:TRIBUTACOS_NO_BROWSER = "1"
$env:HOST = "127.0.0.1"
$env:PORT = "8080"
$healthUrl = "http://127.0.0.1:8080/api/health"
$timeoutSec = 180
$proc = Start-Process -FilePath $exe -PassThru -WindowStyle Hidden
try {
    $ok = $false
    for ($i = 0; $i -lt $timeoutSec; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
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
        $log = Join-Path $env:APPDATA "tributacos\logs\tributacos.log"
        if (Test-Path $log) {
            Write-Host "--- tributacos.log (ultimas 40 lineas) ---"
            Get-Content $log -Tail 40
        } else {
            Write-Host "Sin log en $log"
        }
        throw "Sin respuesta en /api/health tras ${timeoutSec} s"
    }
    Write-Host "OK: health en :8080 (${i}s)"
} finally {
    if (-not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Get-Process -Name "tributacos" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
