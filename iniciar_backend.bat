@echo off
chcp 65001 >nul
title [SalesIA Enterprise - Backend API (Puerto 8000)]
color 0B

echo ================================================================
echo    SALESIA ENTERPRISE - SERVICIO BACKEND (FASTAPI)
echo ================================================================
echo.

cd /d "%~dp0backend"

:: Verificar si PostgreSQL está corriendo en el puerto 5433
echo [1/3] Verificando estado de la Base de Datos PostgreSQL...
netstat -ano | findstr :5433 >nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Iniciando servidor PostgreSQL en puerto 5433...
    if exist "C:\Program Files\PostgreSQL\18\bin\postgres.exe" (
        start "" /B "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "%USERPROFILE%\pg_salesia_data" -p 5433
        timeout /t 3 /nobreak >nul
    ) else (
        echo [ALERTA] No se encontro PostgreSQL 18 instalado en la ruta por defecto.
    )
) else (
    echo [OK] PostgreSQL ya se encuentra activo en el puerto 5433.
)

:: Verificar entorno virtual
echo [2/3] Verificando entorno virtual de Python...
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creando entorno virtual...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Instalando dependencias de backend...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

:: Iniciar servidor FastAPI
echo [3/3] Iniciando Uvicorn en http://127.0.0.1:8000 ...
echo [DOCS] Swagger interactivo disponible en: http://127.0.0.1:8000/api/v1/docs
echo.
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
