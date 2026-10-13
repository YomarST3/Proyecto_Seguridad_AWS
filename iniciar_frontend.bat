@echo off
chcp 65001 >nul
title [SalesIA Enterprise - Frontend Web (Puerto 5173)]
color 0A

echo ================================================================
echo    SALESIA ENTERPRISE - CLIENTE WEB (REACT + VITE)
echo ================================================================
echo.

cd /d "%~dp0frontend"

:: Verificar dependencias
if not exist "node_modules" (
    echo [INFO] Carpeta node_modules no encontrada. Instalando dependencias...
    call npm install
)

echo [INFO] Iniciando servidor de desarrollo Vite en http://127.0.0.1:5173 ...
echo.
call npm run dev -- --host 127.0.0.1 --port 5173
pause
