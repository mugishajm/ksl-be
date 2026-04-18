param(
    [string]$HostAddress = "127.0.0.1",
    [int]$Port = 5000,
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    $DatabaseUrl = [string]$env:DATABASE_URL
}
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Write-Warning "DATABASE_URL is empty. Set it in the environment or pass -DatabaseUrl to enable Mongo-backed APIs."
}

$pythonExe = Join-Path $projectRoot ".venv311\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "Missing .venv311. Create it with:" -ForegroundColor Red
    Write-Host "  py -3.11 -m venv .venv311"
    Write-Host "  .\.venv311\Scripts\python.exe -m pip install -r requirements.txt"
    exit 1
}

$env:API_HOST = $HostAddress
$env:API_PORT = "$Port"
$env:DATABASE_URL = $DatabaseUrl

Write-Host "Starting backend with .venv311 on http://$HostAddress`:$Port ..."
& $pythonExe "api_server.py"
