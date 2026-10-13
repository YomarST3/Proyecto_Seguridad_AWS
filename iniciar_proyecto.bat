@echo off
chcp 65001 >nul
title [SalesIA Enterprise - Launcher Maestro]
color 0F

echo ============================================================================
echo   🛡️  SALESIA ENTERPRISE - PLATAFORMA COMERCIAL & ANALÍTICA
echo ============================================================================
echo.
echo   Iniciando entorno de desarrollo completo:
echo    - Base de Datos : PostgreSQL 18 (Puerto 5433)
echo    - Backend API   : FastAPI + Uvicorn (Puerto 8000)
echo    - Frontend SPA  : React 19 + Vite (Puerto 5173)
echo.
echo ============================================================================

:: 1. Verificar e Iniciar PostgreSQL
echo [PASO 1/4] Comprobando servidor PostgreSQL...
netstat -ano | findstr :5433 >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Iniciando motor PostgreSQL 18 en puerto 5433...
    if exist "C:\Program Files\PostgreSQL\18\bin\postgres.exe" (
        start "PostgreSQL Server" /MIN "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "%USERPROFILE%\pg_salesia_data" -p 5433
        timeout /t 3 /nobreak >nul
    ) else (
        echo [ALERTA] Ruta de PostgreSQL no encontrada. Asegurese de que su base de datos este corriendo.
    )
) else (
    echo [OK] PostgreSQL ya activo en puerto 5433.
)

:: 2. Iniciar Backend en ventana dedicada
echo [PASO 2/4] Desplegando Backend API en ventana independiente...
start "SalesIA Backend API (8000)" cmd /k ""%~dp0iniciar_backend.bat""

:: Esperar a que el backend arranque
timeout /t 3 /nobreak >nul

:: 3. Iniciar Frontend en ventana dedicada
echo [PASO 3/4] Desplegando Frontend Vite en ventana independiente...
start "SalesIA Frontend Web (5173)" cmd /k ""%~dp0iniciar_frontend.bat""

:: Esperar a que Vite esté listo
timeout /t 3 /nobreak >nul

:: 4. Abrir navegador automáticamente
echo [PASO 4/4] Abriendo aplicacion en el navegador...
start http://127.0.0.1:5173

echo.
echo ============================================================================
echo   ✅ SISTEMA EJECUTANDOSE CON EXITO
echo.
echo   - Aplicacion Web : http://127.0.0.1:5173
echo   - API Swagger    : http://127.0.0.1:8000/api/v1/docs
echo   - Healthcheck    : http://127.0.0.1:8000/api/v1/health
echo.
echo   (Para detener todos los servicios, ejecute: detener_servicios.bat)
echo ============================================================================
echo.
pause
