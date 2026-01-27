@echo off
title Nexus Dashboard Launcher
echo ==========================================
echo   NEXUS SERVER DASHBOARD - AUTO STARTER
echo ==========================================
echo.
echo [1/2] Starting Backend Server (Port 3001)...
start "Nexus Backend" /D "%~dp0server" node index.js

echo [2/2] Starting Frontend Interface (Port 5173)...
start "Nexus Frontend" /D "%~dp0client" npm run dev

echo.
echo ==========================================
echo   SYSTEM LAUNCHED!
echo ==========================================
echo.
echo Please wait 5 seconds, then the browser should open...
timeout /t 5
start http://localhost:5173
pause
