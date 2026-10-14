@echo off
title [SalesIA Enterprise - Launcher Maestro]
color 0F

echo ============================================================================
echo   SALESIA ENTERPRISE - PLATAFORMA COMERCIAL Y ANALITICA
echo ============================================================================
echo.
echo   Iniciando entorno de desarrollo completo:
echo    - Base de Datos : Supabase Cloud (AWS us-east-2)
echo    - Backend API   : FastAPI + Uvicorn (Puerto 8000)
echo    - Frontend SPA  : React 19 + Vite (Puerto 5173)
echo.
echo ============================================================================

:: 1. Iniciar Backend en ventana dedicada
echo [PASO 1/3] Desplegando Backend API en ventana independiente...
start "SalesIA Backend API (8000)" cmd /k ""%~dp0iniciar_backend.bat""

:: Esperar a que el backend arranque
timeout /t 3 /nobreak >nul

:: 2. Iniciar Frontend en ventana dedicada
echo [PASO 2/3] Desplegando Frontend Vite en ventana independiente...
start "SalesIA Frontend Web (5173)" cmd /k ""%~dp0iniciar_frontend.bat""

:: Esperar a que Vite este listo
timeout /t 3 /nobreak >nul

:: 3. Abrir navegador automaticamente
echo [PASO 3/3] Abriendo aplicacion en el navegador...
start http://127.0.0.1:5173

echo.
echo ============================================================================
echo   SISTEMA EJECUTANDOSE CON EXITO
echo.
echo   - Aplicacion Web : http://127.0.0.1:5173
echo   - API Swagger    : http://127.0.0.1:8000/api/v1/docs
echo   - Healthcheck    : http://127.0.0.1:8000/api/v1/health
echo.
echo   (Para detener todos los servicios, ejecute: detener_servicios.bat)
echo ============================================================================
echo.
