$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

if (-not (Test-Path $backendDir)) {
    Write-Error "Backend folder not found: $backendDir"
}
if (-not (Test-Path $frontendDir)) {
    Write-Error "Frontend folder not found: $frontendDir"
}

$backendVenvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$legacyVenvPython = Join-Path $root ".venv310\Scripts\python.exe"

if (Test-Path $backendVenvPython) {
    $pythonExe = $backendVenvPython
} elseif (Test-Path $legacyVenvPython) {
    $pythonExe = $legacyVenvPython
} else {
    $pythonExe = "python"
    Write-Host "No local venv python found. Falling back to 'python' from PATH." -ForegroundColor Yellow
}

$backendCommand = "Set-Location '$backendDir'; & '$pythonExe' app.py"
$frontendCommand = "Set-Location '$frontendDir'; npm run dev"

Write-Host "Starting backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null

Start-Sleep -Seconds 1

Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null

Write-Host "Project started in two new terminals." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:5000" -ForegroundColor Green
