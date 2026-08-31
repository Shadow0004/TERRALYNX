# TerraLynx - Dynamic Auto-Installer & Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   TERRALYNX - DISASTER RESPONSE DECISION INTELLIGENCE   " -ForegroundColor Yellow
Write-Host "   Predict. Prepare. Protect.                              " -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

# --- 1. DYNAMIC PATH SETUP ---
$baseDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($baseDir)) { $baseDir = $PWD.Path }
$frontendDir = Join-Path $baseDir "frontend"
$backendDir = Join-Path $baseDir "backend"

Write-Host "Project Directory Detected: $baseDir" -ForegroundColor DarkGray

# --- 2. SMARTER BACKEND DEPENDENCY CHECKER ---
Write-Host "`n[1/4] Checking Python Backend Dependencies..." -ForegroundColor Green
$reqRoot = Join-Path $baseDir "requirements.txt"
$reqBackend = Join-Path $backendDir "requirements.txt"

if (Test-Path $reqRoot) {
    Set-Location $baseDir
    Write-Host "Found requirements.txt in root folder. Installing..." -ForegroundColor Cyan
    python -m pip install -r requirements.txt
    Write-Host "Backend dependencies are up to date." -ForegroundColor Green
} elseif (Test-Path $reqBackend) {
    Set-Location $backendDir
    Write-Host "Found requirements.txt in backend folder. Installing..." -ForegroundColor Cyan
    python -m pip install -r requirements.txt
    Write-Host "Backend dependencies are up to date." -ForegroundColor Green
} else {
    Write-Host "Warning: No requirements.txt found anywhere! Your backend might crash." -ForegroundColor Red
}

# --- 3. FRONTEND DEPENDENCY CHECKER ---
Write-Host "`n[2/4] Checking React/Vite Frontend Dependencies..." -ForegroundColor Green
$packageJsonPath = Join-Path $frontendDir "package.json"
$nodeModulesPath = Join-Path $frontendDir "node_modules"

if (Test-Path $packageJsonPath) {
    Set-Location $frontendDir
    if (-Not (Test-Path $nodeModulesPath)) {
        Write-Host "node_modules missing. Installing npm packages (this may take a minute)..." -ForegroundColor Yellow
        npm install
    } else {
        npm install --prefer-offline --no-audit | Out-Null
        Write-Host "Frontend dependencies are up to date." -ForegroundColor Green
    }
} else {
    Write-Host "Warning: No package.json found in the frontend folder. Skipping..." -ForegroundColor Yellow
}

# --- 4. START SERVERS ---
Write-Host "`n[3/4] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
$backendCommand = "cd '$baseDir'; python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

# Wait 2 seconds for backend init
Start-Sleep -Seconds 2

Write-Host "[4/4] Starting React + Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
$frontendCommand = "cd '$frontendDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

# --- 5. SUCCESS SCREEN ---
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "TerraLynx is now running!" -ForegroundColor Green
Write-Host "Command Center UI: http://localhost:5173" -ForegroundColor White
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $baseDir
