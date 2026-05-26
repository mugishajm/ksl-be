param(
    [string]$HostAddress = "127.0.0.1",
    [int]$Port = 5000,
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$envFile = Join-Path $projectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*#' -or [string]::IsNullOrWhiteSpace($_)) { return }
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
                [Environment]::SetEnvironmentVariable($name, $value, 'Process')
            }
        }
    }
}

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

$depsFlag = Join-Path $projectRoot ".venv311\.deps_installed"
if (-not (Test-Path $depsFlag)) {
    Write-Host "Installing vision dependencies (one-time) ..."
    & $pythonExe -m pip install -r (Join-Path $projectRoot "requirements.txt")
    if ($LASTEXITCODE -ne 0) {
        Write-Host "pip install failed. Fix requirements, then rerun .\start_backend.ps1" -ForegroundColor Red
        exit 1
    }
    New-Item -ItemType File -Path $depsFlag -Force | Out-Null
}

Write-Host "Starting backend with .venv311 on http://$HostAddress`:$Port ..."
Write-Host "Wait for 'Sign model ready' before opening the camera in the browser."
& $pythonExe "api_server.py"
