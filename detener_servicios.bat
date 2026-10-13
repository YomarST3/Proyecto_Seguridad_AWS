@echo off
chcp 65001 >nul
title [SalesIA Enterprise - Detener Servicios]
color 0C

echo ============================================================================
echo   🛑  SALESIA ENTERPRISE - DETENCION DE SERVICIOS LOCALES
echo ============================================================================
echo.

echo [1/3] Deteniendo procesos en puerto 8000 (Backend FastAPI)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/3] Deteniendo procesos en puerto 5173 (Frontend Vite)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [3/3] Deteniendo procesos en puerto 5433 (PostgreSQL)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5433 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [OK] Todos los servicios locales de SalesIA Enterprise han sido detenidos.
echo.
pause
