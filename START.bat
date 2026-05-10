@echo off
title AIMS CRM
color 0A

echo.
echo  ============================================
echo   AIMS CRM - Business Intelligence Platform
echo  ============================================
echo.

start "AIMS Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

start "AIMS Frontend" cmd /k "cd /d %~dp0frontend && pnpm dev"

timeout /t 5 /nobreak >nul

start http://localhost:5173

echo.
echo  App:      http://localhost:5173
echo  API:      http://localhost:8000/docs
echo.
echo  Register your account at login screen.
echo  Close the two terminal windows to stop.
echo.
pause
