# TerraLynx - One-Click Launcher for Windows PowerShell
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   TERRALYNX - DISASTER RESPONSE DECISION INTELLIGENCE   " -ForegroundColor Yellow
Write-Host "   Predict. Prepare. Protect.                              " -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Start Backend in separate window
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\TERRALYNX; .\venv\Scripts\python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

# Wait 2 seconds for backend init
Start-Sleep -Seconds 2

# 2. Start Frontend in separate window
Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\TERRALYNX\frontend; npm run dev"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TerraLynx is now running!" -ForegroundColor Green
Write-Host "Command Center UI: http://localhost:5173" -ForegroundColor White
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
