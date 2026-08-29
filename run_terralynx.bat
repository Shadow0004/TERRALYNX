@echo off
title TerraLynx Launcher
echo ============================================================
echo    TERRALYNX - DISASTER RESPONSE DECISION INTELLIGENCE
echo    Predict. Prepare. Protect.
echo ============================================================

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "TerraLynx Backend" powershell -NoExit -Command "cd d:\TERRALYNX; python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
start "TerraLynx Frontend" powershell -NoExit -Command "cd d:\TERRALYNX\frontend; npm run dev"

echo ============================================================
echo TerraLynx Launch Initiated!
echo UI: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo ============================================================
pause
