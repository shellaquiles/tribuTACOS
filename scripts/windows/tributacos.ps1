param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$runner = Join-Path $rootDir "scripts\tributacos.py"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python no encontrado. Instala Python 3.11+ desde https://python.org"
}

Set-Location $rootDir

if ($Args.Count -eq 0) {
    python $runner help
} else {
    python $runner @Args
}
